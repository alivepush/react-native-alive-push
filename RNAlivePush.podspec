
Pod::Spec.new do |s|

  # NPM package specification
  package = JSON.parse(File.read(File.join(File.dirname(__FILE__), "package.json")))

  s.name         = "RNAlivePush"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = "https://github.com/alivepush/react-native-alive-push.git"
  s.license      = "MIT"
  s.author       = { package["author"]["name"] => package["author"]["email"] }
  s.platform    = :ios, "9.0"
  s.source       = { :git => "https://github.com/alivepush/react-native-alive-push.git", :tag => "master" }
  s.source_files = "ios/**/*.{h,m}"
  s.requires_arc = true


  s.dependency "React"

end

  