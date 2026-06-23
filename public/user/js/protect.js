/**
 * Anti-Inspect Protection
 * Disable DevTools, right-click, view-source shortcuts
 */
(function() {
    // Disable right-click context menu
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
    });

    // Disable keyboard shortcuts (F12, Ctrl+Shift+I/J/C, Ctrl+U)
    document.addEventListener('keydown', function(e) {
        // F12
        if (e.key === 'F12' || e.keyCode === 123) {
            e.preventDefault();
            return false;
        }
        // Ctrl+Shift+I / Ctrl+Shift+J / Ctrl+Shift+C
        if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c')) {
            e.preventDefault();
            return false;
        }
        // Ctrl+U (view source)
        if (e.ctrlKey && (e.key === 'u' || e.key === 'U')) {
            e.preventDefault();
            return false;
        }
        // Ctrl+S (save page)
        if (e.ctrlKey && (e.key === 's' || e.key === 'S')) {
            e.preventDefault();
            return false;
        }
    });

    // DevTools detection via debugger timing
    var threshold = 160;
    setInterval(function() {
        var start = performance.now();
        debugger;
        var end = performance.now();
        if (end - start > threshold) {
            document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#0f172a;color:#ef4444;font-family:sans-serif;font-size:18px;font-weight:600;text-align:center;padding:20px">Akses ditolak. Tutup DevTools untuk melanjutkan.</div>';
        }
    }, 1000);

    // Disable drag
    document.addEventListener('dragstart', function(e) {
        e.preventDefault();
    });

    // Disable text selection via CSS
    document.documentElement.style.cssText += '-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;';

    // Allow text selection on input/textarea
    document.addEventListener('DOMContentLoaded', function() {
        var style = document.createElement('style');
        style.textContent = 'input,textarea,select,.allow-select{-webkit-user-select:text!important;-moz-user-select:text!important;user-select:text!important}';
        document.head.appendChild(style);
    });
})();
