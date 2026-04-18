// Override Gmeek's modeSwitch to remove auto theme
(function() {
    if (typeof modeSwitch === 'function') {
        var originalModeSwitch = modeSwitch;
        modeSwitch = function() {
            var currentMode = document.documentElement.getAttribute('data-color-mode');
            var newMode = currentMode === "light" ? "dark" : "light";
            localStorage.setItem("meek_theme", newMode);
            if (themeSettings[newMode]) {
                changeTheme(...themeSettings[newMode]);
            }
        };
    }
})();