enyo.kind({
    name: "enyo.FindApps.Magazine.MagazineHelper",
    kind: enyo.Component,
    pageNumRegex: /(page)(\d+)/,
    sectionFromFileRegex: /(\/)?([^\/]*)\/(.*)/,
    typeFromFileRegexs: [{
        regex: /(.*)\.(jpg|png|gif)$/,
        type: "image"
    }, {
        regex: /(.*)\.(lo.js)$/,
        type: "layout"
    }, {
        regex: /(.*)\.(json)$/,
        type: "binding"
    }, {
        regex: /(.*)\.(css)$/,
        type: "css"
    }, ],
    getPageNum: function(section) {
        var pageNumResult = -1;
        if (section && section !== 'common') {
            var result = this.pageNumRegex.exec(section);
            // example of expected groups: [page0, page, 0]
            if (result && result.length >= 3) {
                pageNumResult = parseInt(result[2], 10);
            }
        }
        return pageNumResult;
    },
    getSectionFromFile: function(filename) {
        var section = undefined;
        if (filename && filename.length > 0) {
            var result = this.sectionFromFileRegex.exec(filename);
            if (result && result.length >= 3) {
                section = result[2];
            }
        }
        return section;
    },
    getTypeFromFile: function(filename) {
        var type = undefined,
            typeInfo, i, result;
        if (filename && filename.length > 0) {
            for (i = 0; i < this.typeFromFileRegexs.length; i++) {
                typeInfo = this.typeFromFileRegexs[i];
                result = typeInfo.regex.exec(filename);
                if (result && result.length >= 3) {
                    type = typeInfo.type;
                    break;
                }
            }
        }
        return type;
    },
    getCanonicalFilename: function(filename) {
        return filename.replace(/^\.\//, "");
    }
});
