/* See license.txt for terms of usage */

define([
    "firebug/lib/trace",
    "firebug/lib/dom",
    "firebug/lib/url",
    "firebug/net/netUtils",
],
function(FBTrace, Dom, Url, NetUtils) {

// ********************************************************************************************* //
// Constants

var Fonts = {};
var mimes = {
    "woff": "application/font-woff",
    "ttf": "application/x-font-ttf",
    "otf": "application/x-otf",
};

// List of font content types
var contentTypes =
[
    "application/x-woff",
    "application/x-font-woff",
    "application/x-ttf",
    "application/x-font-ttf",
    "font/ttf",
    "font/woff",
    "application/x-otf",
    "application/x-font-otf",
    "application/font-woff"
];

// ********************************************************************************************* //
// Fonts

/**
 * Retrieves all fonts used inside a node
 * @node: Node to return the fonts for
 * @return Array of fonts
 */
Fonts.getFonts = function(node)
{
    if (!Dom.domUtils)
        return [];

    var range = node.ownerDocument.createRange();
    try
    {
        range.selectNode(node);
    }
    catch(err)
    {
        if (FBTrace.DBG_FONTS || FBTrace.DBG_ERRORS)
            FBTrace.sysout("Fonts.getFonts; node couldn't be selected", err);
    }

    var fontFaces = Dom.domUtils.getUsedFontFaces(range);
    var fonts = [];
    for (var i=0; i<fontFaces.length; i++)
        fonts.push(fontFaces.item(i));

    if (FBTrace.DBG_FONTS)
        FBTrace.sysout("Fonts.getFonts; used fonts", fonts);

    return fonts;
};

/**
 * Retrieves all fonts used in a context, cached so that the first use is
 * potentially slow (several seconds on the HTML5 spec), and later ones are
 * instant but not up-to-date.
 * @context: Context to return the fonts for
 * @return Array of fonts
 */
Fonts.getFontsUsedInContext = function(context)
{
    if (context.fontCache)
        return context.fontCache;

    var fonts = [];
    if (context.window)
    {
        var doc = context.window.document;
        if (doc)
            fonts = Fonts.getFonts(doc.documentElement);
    }
    context.fontCache = fonts;
    return fonts;
};

/**
 * Retrieves the information about a font
 * @context: Context of the font
 * @win: Window the font is used in
 * @identifier: Either a URL in case of a web font or the font name
 * @return Object with information about the font
 */
Fonts.getFontInfo = function(context, win, identifier)
{
    if (!context)
        context = Firebug.currentContext;

    var doc = win ? win.document : context.window.document;
    if (!doc)
    {
        if (FBTrace.DBG_ERRORS)
            FBTrace.sysout("lib.getFontInfo; NO DOCUMENT", {win:win, context:context});
        return false;
    }

    var fonts = Fonts.getFonts(doc.documentElement);

    if (FBTrace.DBG_FONTS)
        FBTrace.sysout("Fonts.getFontInfo;", {fonts:fonts, identifier: identifier});

    for (var i=0; i<fonts.length; i++)
    {
        if (identifier == fonts[i].URI ||
            identifier.toLowerCase() == fonts[i].CSSFamilyName.toLowerCase() ||
            identifier.toLowerCase() == fonts[i].name.toLowerCase())
        {
            return fonts[i];
        }
    }

    return false;
};

/**
 * Returns the mime for a given font name ("woff", "otf" or "ttf").
 *
 * @param {String} fontName The font name.
 *
 * @return {String} The mime.
 */
Fonts.getMimeForFont = function(fontName)
{
    if (typeof fontName !== "string")
    {
        if (FBTrace.DBG_FONTS)
            FBTrace.sysout("Fonts.getMimeForFont; fontName is not a string", fontName);
        return null;
    }
    fontName = fontName.toLowerCase();
    var mime = mimes[fontName];
    if (!mime && FBTrace.DBG_FONTS)
        FBTrace.sysout("Fonts.getMimeForFont; Unsupported font for " + fontName);
    return mime || null;
};

/**
 * Checks whether the given file name and content are a valid font file
 *
 * @param contentType: MIME type of the file
 * @param url: URL of the file
 * @param data: File contents
 * @return True, if the given data outlines a font file, otherwise false
 */
Fonts.isFont = function(contentType, url, data)
{
    if (!contentType)
        return false;

    if (NetUtils.matchesContentType(contentType, contentTypes))
    {
        if (FBTrace.DBG_FONTS)
        {
            FBTrace.sysout("fontviewer.isFont; content type: "+contentType,
                {url: url, data: data});
        }

        return true;
    }

    // Workaround for font responses without proper content type
    // Let's consider all responses starting with "wOFF" as font. In the worst
    // case there will be an exception when parsing. This means that no-font
    // responses (and post data) (with "wOFF") can be parsed unnecessarily,
    // which represents a little overhead, but this happens only if the request
    // is actually expanded by the user in the UI (Net & Console panel).
    var extension = Url.getFileExtension(url);
    var validExtension = (["woff","otf","ttf"].indexOf(extension) !== -1);
    if (validExtension && (!data || Str.hasPrefix(data, "wOFF") || Str.hasPrefix(data, "OTTO")))
    {
        if (FBTrace.DBG_FONTS)
        {
            FBTrace.sysout("fontviewer.isFont; Font without proper content type",
                {url: url, data: data});
        }

        return true;
    }

    contentType = contentType.split(";")[0];
    contentType = Str.trim(contentType);
    return contentTypes[contentType];
};

Fonts.contentTypes = contentTypes;

// ********************************************************************************************* //

return Fonts;

// ********************************************************************************************* //
});
