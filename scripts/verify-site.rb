require "json"
require "github-pages"

root = File.expand_path("..", __dir__)
site = Jekyll::Site.new(Jekyll.configuration("source" => root, "destination" => File.expand_path(ARGV.fetch(0, "_site"), root)))
site.read
recipes = site.collections.fetch("recipes").docs
abort "No recipes found" if recipes.empty?

read_output = lambda do |path|
  abort "Missing or empty output: #{path}" unless File.file?(path) && File.size?(path)
  File.read(path)
end

# Kramdown is already a Jekyll dependency; parse HTML to respect nested sections.
descendants = lambda do |node|
  [node] + node.children.flat_map { |child| descendants.call(child) }
end
string_fields = %w[url title_en title_ja genre]
array_fields = %w[ingredients_en ingredients_ja]
valid_field = lambda do |field, value|
  nonempty_string = ->(item) { item.is_a?(String) && item.match?(/[^[:space:]]/) }
  if array_fields.include?(field)
    value.is_a?(Array) && !value.empty? && value.all? { |item| nonempty_string.call(item) }
  else
    nonempty_string.call(value)
  end
end
expected_index = recipes.map do |recipe|
  entry = (string_fields + array_fields).to_h { |field| [field, recipe.data[field]] }
  entry["url"] = Liquid::Template.parse("{{ url | relative_url }}").render!(
    { "url" => recipe.url }, registers: { site: site })
  %w[title_en title_ja].each do |field|
    value = entry[field]
    entry[field] = recipe.data["title"] if value.nil? || value == false || value == ""
  end
  entry.each do |field, value|
    abort "Invalid source #{field}: #{recipe.path}" unless valid_field.call(field, value)
  end
  entry
end
expected_by_url = expected_index.to_h { |entry| [entry.fetch("url"), entry] }
abort "Duplicate source recipe URLs" unless expected_by_url.length == recipes.length

pages = [File.join(site.dest, "index.html")] + recipes.map { |recipe| recipe.destination(site.dest) }
bodies = {}
pages.each do |path|
  html = read_output.call(path)
  abort "Unrendered Liquid in #{path}" if html.match?(/\{%|\{\{/)
  nodes = descendants.call(Kramdown::Document.new(html, input: "html").root)
  containers = nodes.select do |node|
    node.type == :html_element && node.value == "main" &&
      node.attr.fetch("class", "").split.include?("page-container")
  end
  abort "Missing or duplicate page layout in #{path}" unless containers.length == 1
  bodies[path] = containers.first
  scripts = nodes.select do |node|
    node.type == :html_element && node.value == "script" && node.attr["id"] == "recipe-data"
  end
  abort "Missing or duplicate search index in #{path}" unless scripts.length == 1
  script = scripts.first
  abort "Invalid search index type in #{path}" unless script.attr["type"] == "application/json"
  begin
    index = JSON.parse(script.children.map(&:value).join)
  rescue JSON::ParserError
    abort "Invalid search index JSON in #{path}"
  end
  abort "Invalid search index array in #{path}" unless index.is_a?(Array)
  abort "Incomplete recipe search index in #{path}" unless index.length == expected_index.length
  seen_urls = []
  index.each do |entry|
    abort "Invalid search index entry in #{path}" unless entry.is_a?(Hash)
    (string_fields + array_fields).each do |field|
      abort "Missing search index #{field} in #{path}" unless entry.key?(field)
      abort "Invalid search index #{field} in #{path}" unless valid_field.call(field, entry[field])
    end
    expected = expected_by_url[entry["url"]]
    abort "Mismatched search index url in #{path}" unless expected
    abort "Duplicate search index url in #{path}" if seen_urls.include?(entry["url"])
    seen_urls << entry["url"]
    expected.each do |field, value|
      abort "Mismatched search index #{field} for #{entry['url']} in #{path}" unless entry[field] == value
    end
  end
end
recipes.each do |recipe|
  body = bodies.fetch(recipe.destination(site.dest))

  %w[en ja].each do |language|
    sections = descendants.call(body).select do |node|
      node.type == :html_element && node.attr.fetch("class", "").split.include?("lang") &&
        node.attr["data-lang"] == language
    end
    abort "Missing #{language} recipe content: #{recipe.path}" if sections.empty?
    abort "Duplicate #{language} recipe content: #{recipe.path}" unless sections.length == 1
    nonempty = sections.all? do |section|
      descendants.call(section).any? do |node|
        text = case node.type
               when :text, :codespan, :codeblock then node.value.to_s
               when :entity then node.value.code_point.chr(Encoding::UTF_8)
               else ""
               end
        text.match?(/[^[:space:]]/)
      end
    end
    abort "Empty #{language} recipe content: #{recipe.path}" unless nonempty
  end
end

assets = %w[assets/css/style.css assets/js/lang-toggle.js assets/js/recipe-search.js assets/js/recipe-tools.js assets/images/temp.png robots.txt]
assets.each do |asset|
  output = File.join(site.dest, asset)
  read_output.call(output)
  abort "Asset differs from source: #{asset}" unless File.binread(output) == File.binread(File.join(root, asset))
end
puts "Verified #{recipes.length} recipe pages, homepage, search indexes, and #{assets.length} assets."
