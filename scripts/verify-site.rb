require "json"
require "jekyll"

root = File.expand_path("..", __dir__)
site = Jekyll::Site.new(Jekyll.configuration("source" => root, "destination" => File.expand_path(ARGV.fetch(0, "_site"), root)))
site.read
recipes = site.collections.fetch("recipes").docs
abort "No recipes found" if recipes.empty?

read_output = lambda do |path|
  abort "Missing or empty output: #{path}" unless File.file?(path) && File.size?(path)
  File.read(path)
end

pages = [File.join(site.dest, "index.html")] + recipes.map { |recipe| recipe.destination(site.dest) }
pages.each do |path|
  html = read_output.call(path)
  abort "Unrendered Liquid in #{path}" if html.match?(/\{%|\{\{/)
  abort "Missing page layout in #{path}" unless html.include?('<main class="page-container">')
  data = html.match(/<script id="recipe-data" type="application\/json">([\s\S]*?)<\/script>/)
  abort "Missing search index in #{path}" unless data
  index = JSON.parse(data[1])
  expected_urls = recipes.map(&:url).sort
  abort "Incomplete recipe search index in #{path}" unless index.map { |entry| entry.fetch("url") }.sort == expected_urls
end

# Kramdown is already a Jekyll dependency; parse HTML to respect nested sections.
descendants = lambda do |node|
  [node] + node.children.flat_map { |child| descendants.call(child) }
end
recipes.each do |recipe|
  html = read_output.call(recipe.destination(site.dest))
  document = Kramdown::Document.new(html, input: "html").root
  body = descendants.call(document).find do |node|
    node.type == :html_element && node.value == "main" &&
      node.attr.fetch("class", "").split.include?("page-container")
  end
  abort "Missing recipe body: #{recipe.path}" unless body

  %w[en ja].each do |language|
    sections = descendants.call(body).select do |node|
      node.type == :html_element && node.attr.fetch("class", "").split.include?("lang") &&
        node.attr["data-lang"] == language
    end
    abort "Missing #{language} recipe content: #{recipe.path}" if sections.empty?
    nonempty = sections.any? do |section|
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
