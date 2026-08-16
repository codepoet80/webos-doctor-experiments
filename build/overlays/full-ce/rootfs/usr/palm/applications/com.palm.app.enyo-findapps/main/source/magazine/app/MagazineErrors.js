var MagazineErrors = {};
MagazineErrors.EDITION_NOT_LOADED = "edition_not_loaded";
MagazineErrors.EDITION_FILESET_NOT_LOADED = "edition_fileset_not_loaded";
MagazineErrors.TEMPLATE_NOT_PROVIDED = "template_not_provided";
MagazineErrors.TEMPLATE_NOT_LOADED = "template_not_loaded";
MagazineErrors.BINDING_NOT_LOADED = "binding_not_loaded";
MagazineErrors.ROOT_PAGE_NOT_FOUND = "root_page_not_found";
MagazineErrors.INVALID_PAGE_TEMPLATE = "invalid_page_template";
MagazineErrors.INVALID_PAGE_BINDING = "invalid_page_binding";
MagazineErrors.LOADING_DEFAULT_EDITION = "loading_def_edition";
MagazineErrors.UNABLE_TO_INIT_MAGAZINE = "unable_to_init_magazine";
MagazineErrors._errorStrings = {};
(function() {
    var strings = MagazineErrors._errorStrings;
    strings[MagazineErrors.EDITION_NOT_LOADED] = $L("ACC Magazine: Couldn't load current edition info");
    strings[MagazineErrors.EDITION_FILESET_NOT_LOADED] = $L("ACC Magazine: Couldn't load file set for current edition ");
    strings[MagazineErrors.TEMPLATE_NOT_PROVIDED] = $L("Missing template path");
    strings[MagazineErrors.TEMPLATE_NOT_LOADED] = $L("Couldn't load given template ");
    strings[MagazineErrors.BINDING_NOT_LOADED] = $L("Couldn't load given binding");
    strings[MagazineErrors.ROOT_PAGE_NOT_FOUND] = $L("Root magazine page not found");
    strings[MagazineErrors.INVALID_PAGE_TEMPLATE] = $L("Page File set is missing either section or layouts needed to resolve physical path");
    strings[MagazineErrors.INVALID_PAGE_BINDING] = $L("Page File set is missing either section or bindings needed to resolve physical path");
    strings[MagazineErrors.LOADING_DEFAULT_EDITION] = $L("Trying to load the default edition");
    strings[MagazineErrors.UNABLE_TO_INIT_MAGAZINE] = $L("Failed to load both current and default editions");
})();
MagazineErrors.getErrorString = function(errorCode) {
    return this._errorStrings[errorCode];
}
