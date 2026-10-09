require "json"
require "jekyll"

root = File.expand_path("..", __dir__)
site = Jekyll::Site.new(Jekyll.configuration("source" => root, "destination" => File.join(root, "_site")))
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

recipes.each do |recipe|
  html = read_output.call(recipe.destination(site.dest))
  %w[en ja].each do |language|
    abort "Missing #{language} recipe content: #{recipe.path}" unless html.include?(%Q(data-lang="#{language}"))
  end
end

assets = %w[assets/css/style.css assets/js/lang-toggle.js assets/js/recipe-search.js assets/js/recipe-tools.js assets/images/temp.png robots.txt]
assets.each do |asset|
  output = File.join(site.dest, asset)
  read_output.call(output)
  abort "Asset differs from source: #{asset}" unless File.binread(output) == File.binread(File.join(root, asset))
end
puts "Verified #{recipes.length} recipe pages, homepage, search indexes, and #{assets.length} assets."
