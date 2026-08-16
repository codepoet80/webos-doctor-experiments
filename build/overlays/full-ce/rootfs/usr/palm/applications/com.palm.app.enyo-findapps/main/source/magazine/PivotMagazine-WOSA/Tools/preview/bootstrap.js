(function () {
    var params = new URLSearchParams(window.location.search);
    var issue = params.get('issue') || 'Current';
    var lang  = params.get('lang')  || 'en';
    var startPage = parseInt(params.get('page') || '0', 10);
    var issueBase = window.location.origin + '/PivotMagazine-WOSA/Issues/' + issue + '/' + lang;

    // Must be set before Magazine.create() is called inside renderInto().
    AppCatalog.Config.draftEditionDir = issueBase;

    // Inject the magazine's own CSS from the issue folder.
    ['common/css/magazine.css', 'common/css/page.css'].forEach(function (path) {
        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = issueBase + '/' + path;
        document.head.appendChild(link);
    });

    // All DOM access deferred until the body exists.
    window.addEventListener('DOMContentLoaded', function () {
        document.getElementById('issue-input').value = issue;
        document.getElementById('lang-input').value = lang;

        var magazine = null;
        var currentPage = startPage;

        function updatePageInfo() {
            document.getElementById('page-info').textContent = 'Page ' + currentPage;
        }

        function navigate(page) {
            if (!magazine) return;
            currentPage = page;
            magazine.setInternetTargetPage(currentPage);
            updatePageInfo();
        }

        function sizeMagazineNodes(w, h) {
            // The magazine is a VFlexBox rendered into #viewport. VFlexBox
            // children don't auto-stretch to fill their parent, so the
            // carousel's getBounds() returns a short height unless we
            // explicitly size both the magazine root node and the carousel
            // node to match the viewport. measureControlSize() then gets the
            // right dimensions and pages aren't undersized.
            if (!magazine) return;
            var ws = w + 'px', hs = h + 'px';
            var magNode = magazine.hasNode();
            if (magNode) { magNode.style.width = ws; magNode.style.height = hs; }
            var car = magazine.$.magazineContainer;
            var carNode = car && car.hasNode();
            if (carNode) { carNode.style.width = ws; carNode.style.height = hs; }
        }

        function setOrientation(mode) {
            var vp = document.getElementById('viewport');
            var w, h;
            if (mode === 'portrait') { w = 768; h = 1024; }
            else                     { w = 1024; h = 768; }
            vp.style.width  = w + 'px';
            vp.style.height = h + 'px';
            sizeMagazineNodes(w, h);
            if (magazine) magazine.update();
        }

        document.getElementById('btn-prev').onclick = function () {
            if (currentPage > 0) navigate(currentPage - 1);
        };
        document.getElementById('btn-next').onclick = function () {
            navigate(currentPage + 1);
        };
        document.getElementById('btn-portrait').onclick  = function () { setOrientation('portrait'); };
        document.getElementById('btn-landscape').onclick = function () { setOrientation('landscape'); };
        document.getElementById('btn-reload').onclick = function () {
            var ni = document.getElementById('issue-input').value.trim();
            var nl = document.getElementById('lang-input').value.trim();
            window.location.search = '?issue=' + ni + '&lang=' + nl + '&page=0';
        };

        updatePageInfo();

        magazine = new enyo.FindApps.Magazine.Magazine({});
        magazine.renderInto(document.getElementById('viewport'));
        sizeMagazineNodes(768, 1024);
        setOrientation('portrait');

        if (startPage > 0) {
            setTimeout(function () { navigate(startPage); }, 500);
        }
    });
})();
