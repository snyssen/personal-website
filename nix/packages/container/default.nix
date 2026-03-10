{ pkgs, ... }:
let
  personal-website = import ../personal-website { inherit pkgs; };

  # Assemble the /app directory that will live inside the container.
  # Copying dist/ creates a real directory tree; copying node_modules with
  # -rP preserves the symlink created by npmConfigHook, which lets
  # dockerTools pull every referenced store path into the image automatically.
  appDir = pkgs.runCommand "personal-website-app" { } ''
    mkdir -p "$out/app"
    cp -r  "${personal-website}/dist"         "$out/app/dist"
    cp -rP "${personal-website}/node_modules" "$out/app/node_modules"
    cp     "${personal-website}/package.json" "$out/app/package.json"
  '';
in
pkgs.dockerTools.buildLayeredImage {
  name = "personal-website";
  tag = "latest";

  contents = [
    pkgs.nodejs_22
    pkgs.cacert
    appDir
  ];

  config = {
    WorkingDir = "/app";
    Env = [
      "HOST=0.0.0.0"
      "PORT=80"
      "NODE_ENV=production"
      "PATH=${pkgs.nodejs_22}/bin"
    ];
    # Mirror the CMD from the original Dockerfile exactly.
    Cmd = [ "node" "./dist/server/entry.mjs" ];
    ExposedPorts = {
      "80/tcp" = { };
    };
  };
}
