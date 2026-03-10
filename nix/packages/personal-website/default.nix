{ pkgs, ... }:
let
  packageJson = builtins.fromJSON (builtins.readFile ../../../package.json);
  browsers =
    (builtins.fromJSON (builtins.readFile "${pkgs.playwright-driver}/browsers.json")).browsers;
  chromium-rev = (builtins.head (builtins.filter (b: b.name == "chromium") browsers)).revision;
in
pkgs.buildNpmPackage {
  pname = packageJson.name;
  version = packageJson.version;

  src = pkgs.lib.cleanSource ../../..;

  # Use importNpmLock so no hash needs to be computed manually.
  # Only package.json and package-lock.json are hashed, so changes to
  # other source files don't invalidate the dependency derivation.
  npmDeps = pkgs.importNpmLock {
    npmRoot = pkgs.lib.fileset.toSource {
      root = ../../..;
      fileset = pkgs.lib.fileset.unions [
        ../../../package.json
        ../../../package-lock.json
      ];
    };
  };
  npmConfigHook = pkgs.importNpmLock.npmConfigHook;

  nativeBuildInputs = with pkgs; [
    pagefind
    playwright-driver.browsers
    procps
    libX11
    libXcomposite
    libXdamage
    libXext
    libXfixes
    libXrandr
    libxcb
    libuuid
    libxkbcommon
    dbus
    mesa
    cups
    nspr
    nss
    libdrm
  ];

  # Tell the playwright npm package not to download browsers; use the
  # nixpkgs-provided Chromium binary instead.
  PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD = "1";
  PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH = "${pkgs.playwright-driver.browsers}/chromium-${chromium-rev}/chrome-linux64/chrome";

  # Bake the version (kept in sync by release-please) and site URL into
  # the build so Astro can embed them in the generated pages.
  APP_VERSION = packageJson.version;
  WEBSITE_URI = "https://snyssen.be";

  buildPhase = ''
    runHook preBuild
    export LD_LIBRARY_PATH="${
      pkgs.lib.makeLibraryPath [
        pkgs.libX11
        pkgs.libXcomposite
        pkgs.libXdamage
        pkgs.libXext
        pkgs.libXfixes
        pkgs.libXrandr
        pkgs.libxcb
        pkgs.libuuid
        pkgs.libxkbcommon
        pkgs.dbus
        pkgs.mesa
        pkgs.cups
        pkgs.nspr
        pkgs.nss
        pkgs.libdrm
      ]
    }:$LD_LIBRARY_PATH"
    npm run build
    pagefind --site dist/client
    npm run generate-pdf:ci
    runHook postBuild
  '';

  installPhase = ''
    runHook preInstall
    mkdir -p "$out"
    cp -r dist "$out/dist"
    cp package.json "$out/"
    # Preserve the node_modules symlink created by npmConfigHook so that
    # dockerTools can follow it and pull all referenced store paths into
    # the container image automatically.
    cp -rP node_modules "$out/node_modules"
    runHook postInstall
  '';
}
