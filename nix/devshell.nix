{ pkgs }:
let
  browsers =
    (builtins.fromJSON (builtins.readFile "${pkgs.playwright-driver}/browsers.json")).browsers;
  chromium-rev = (builtins.head (builtins.filter (x: x.name == "chromium") browsers)).revision;
in
pkgs.mkShell {
  # Add build dependencies
  packages = with pkgs; [
    nixfmt
    nixd
    just
    pre-commit

    nodejs_22
    playwright-driver.browsers
  ];

  # Add environment variables
  env = {
    PLAYWRIGHT_LAUNCH_OPTIONS_EXECUTABLE_PATH = "${pkgs.playwright-driver.browsers}/chromium-${chromium-rev}/chrome-linux64/chrome";
  };

  # Load custom bash code
  shellHook = ''
    echo -e "This devshell uses '\e[32;1mjust\e[0m' as a task runner."
    just --list
    echo -e "\e[0;95mNOTE:\e[0m If this is your first time on this repo, running '\e[32;1mjust setup\e[0m' is recommended in order to initialize the development environment."
  '';
}
