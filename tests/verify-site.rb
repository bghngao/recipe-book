# Exercise the real verifier against generated pages while preserving the header.
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
  check = lambda do |body, expected_error|
    html = original.sub(/(<main class="page-container">)[\s\S]*?(<\/main>)/) { "#{$1}#{body}#{$2}" }
    abort "Fixture must retain both header language toggles" unless
      html.include?('class="lang-badge" data-lang="en"') && html.include?('class="lang-badge" data-lang="ja"')
    File.write(output_path, html)
    stdout, stderr, status = Open3.capture3(RbConfig.ruby, verifier, destination)
    if expected_error
      abort "Expected #{expected_error}, got #{stdout}#{stderr}" if status.success? || !stderr.include?(expected_error)
    else
      abort "Valid bilingual body rejected: #{stdout}#{stderr}" unless status.success?
    end
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
end
puts "Passed 5 recipe body validation regressions (valid, missing en/ja, empty en/ja)."
