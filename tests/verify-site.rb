# Exercise the real verifier against generated pages while preserving the header.
require "json"
require "fileutils"
require "open3"
require "rbconfig"
require "tmpdir"

root = File.expand_path("..", __dir__)
verifier = File.join(root, "scripts", "verify-site.rb")
recipe_path = Dir.glob(File.join(root, "_site", "recipes", "*", "index.html")).first
abort "Build the site before running verifier regression tests" unless recipe_path
original = File.read(recipe_path)
relative_path = recipe_path.delete_prefix(File.join(root, "_site") + "/")

Dir.mktmpdir("verify-site-") do |destination|
  FileUtils.cp_r(File.join(root, "_site", "."), destination)
  output_path = File.join(destination, relative_path)
  cases = 0
  check_html = lambda do |html, expected_error|
    abort "Fixture must retain both header language toggles" unless
      html.include?('class="lang-badge" data-lang="en"') && html.include?('class="lang-badge" data-lang="ja"')
    cases += 1
    File.write(output_path, html)
    stdout, stderr, status = Open3.capture3(RbConfig.ruby, verifier, destination)
    if expected_error
      abort "Expected #{expected_error}, got #{stdout}#{stderr}" if status.success? || !stderr.include?(expected_error)
    else
      abort "Valid bilingual body rejected: #{stdout}#{stderr}" unless status.success?
    end
  end

  check = lambda do |body, expected_error|
    html = original.sub(/(<main class="page-container">)[\s\S]*?(<\/main>)/) { "#{$1}#{body}#{$2}" }
    check_html.call(html, expected_error)
  end

  sections = {
    "en" => '<div class="lang" data-lang="en"><div><p>Butter and eggs</p></div></div>',
    "ja" => '<div class="lang" data-lang="ja"><div><p>バターと卵</p></div></div>'
  }
  check.call(sections.values.join, nil)
  sections.each_key do |language|
    other = sections.fetch(language == "en" ? "ja" : "en")
    check.call(other, "Missing #{language} recipe content")
    empty = %Q(<div class="lang" data-lang="#{language}"><!-- recipe removed --><div><p> &nbsp; </p><br></div></div>)
    check.call(other + empty, "Empty #{language} recipe content")
  end
  check.call(sections.values.join + sections.fetch("en"), "Duplicate en recipe content")
  check_html.call(original.sub('<main class="page-container">', '<!-- <main class="page-container"> --> <main>'),
                  "Missing or duplicate page layout")

  index_pattern = /(<script id="recipe-data" type="application\/json">)([\s\S]*?)(<\/script>)/
  match = original.match(index_pattern)
  abort "Missing generated search index fixture" unless match
  original_index = JSON.parse(match[2])
  check_index = lambda do |index, expected_error|
    html = original.sub(index_pattern) { "#{$1}#{JSON.generate(index)}#{$3}" }
    check_html.call(html, expected_error)
  end
  %w[url title_en title_ja genre ingredients_en ingredients_ja].each do |field|
    mutations = {
      "Missing" => ->(entry) { entry.delete(field) },
      "Invalid" => ->(entry) { entry[field] = nil },
      "Mismatched" => ->(entry) { entry[field] = field.start_with?("ingredients_") ? ["Incorrect ingredient"] : "Incorrect value" }
    }
    mutations.each do |error, mutate|
      index = Marshal.load(Marshal.dump(original_index))
      mutate.call(index.first)
      check_index.call(index, "#{error} search index #{field}")
    end
    index = Marshal.load(Marshal.dump(original_index))
    index.first[field] = field.start_with?("ingredients_") ? [42] : ["Wrong type"]
    check_index.call(index, "Invalid search index #{field}")
    index.first[field] = field.start_with?("ingredients_") ? [" "] : " "
    check_index.call(index, "Invalid search index #{field}")
  end
  check_index.call({}, "Invalid search index array")
  check_index.call(original_index.drop(1), "Incomplete recipe search index")
  duplicate = original_index.dup
  duplicate[1] = duplicate.first
  check_index.call(duplicate, "Duplicate search index url")
  invalid_entry = original_index.dup
  invalid_entry[0] = "Not an object"
  check_index.call(invalid_entry, "Invalid search index entry")
  check_index.call(original_index.reverse, nil)
  check_html.call(original.sub(index_pattern) { "#{$1}not JSON#{$3}" }, "Invalid search index JSON")
  check_html.call(original.sub(index_pattern) { "<!-- #{$&} -->" }, "Missing or duplicate search index")
  check_html.call(original.sub(index_pattern) { "#{$&}#{$&}" }, "Missing or duplicate search index")
  puts "Passed #{cases} verifier regression cases."

end
