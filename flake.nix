{
  inputs = {
    utils.url = "github:numtide/flake-utils";
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
  };
  outputs = { self, nixpkgs, utils }:
    utils.lib.eachDefaultSystem (system:
      let pkgs = nixpkgs.legacyPackages.${system};
      in {
        # TODO: Update nix dev env structure
        # TODO: Instal playwright the nix way -> https://primamateria.github.io/blog/playwright-nixos-webdev/
        # TODO: Build package using Nix?
        devShell = pkgs.mkShell {
          buildInputs = with pkgs; [
            nixfmt
            nixd
            just
            pre-commit
            nodejs_22
            playwright-driver.browsers
          ];

          shellHook = ''
            export PLAYWRIGHT_BROWSERS_PATH=${pkgs.playwright-driver.browsers}
            export PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=true
            export PLAYWRIGHT_HOST_PLATFORM_OVERRIDE="ubuntu-24.04"
          '';
        };
      });
}
