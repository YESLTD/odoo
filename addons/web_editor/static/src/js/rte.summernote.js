odoo.define('web_editor.rte.summernote', function (require) {
'use strict';

var core = require('web.core');
var ajax = require('web.ajax');
var base = require('web_editor.base');
var widgets = require('web_editor.widget');
var rte = require('web_editor.rte');

var QWeb = core.qweb;
var _t = core._t;

//////////////////////////////////////////////////////////////////////////////////////////////////////////

ajax.jsonRpc('/web/dataset/call', 'call', {
    'model': 'ir.ui.view',
    'method': 'read_template',
    'args': ['web_editor.colorpicker', base.get_context()]
}).done(function (data) {
    QWeb.add_template(data);
});

//////////////////////////////////////////////////////////////////////////////////////////////////////////
/* Summernote Lib (neek change to make accessible: method and object) */

var dom = $.summernote.core.dom;
var range = $.summernote.core.range;
var eventHandler = $.summernote.eventHandler;
var renderer = $.summernote.renderer;
var options = $.summernote.options;
var pluginEvents = $.summernote.pluginEvents;

var tplButton = renderer.getTemplate().button;
var tplIconButton = renderer.getTemplate().iconButton;
var tplDropdown = renderer.getTemplate().dropdown;

//////////////////////////////////////////////////////////////////////////////////////////////////////////
/* update and change the popovers content, and add history button */

var fn_createPalette = renderer.createPalette;
renderer.createPalette = function ($container, options) {
    fn_createPalette.call(this, $container, options);

    if (!QWeb.has_template('web_editor.colorpicker')) {
        return;
    }

    var $color = $container.find('.note-color');
    var html = QWeb.render('web_editor.colorpicker');
    $color.find('.note-color-palette').prepend(html);
    var $bg = $color.find('.colorpicker:first button');
    var $fore = $color.find('.colorpicker:last button');

    $bg.each(function () { $(this).attr('data-event', 'backColor').attr('data-value', $(this).attr('class')); });
    $fore.each(function () { $(this).attr('data-event', 'foreColor').attr('data-value', $(this).attr('class').replace(/bg-/, 'text-')); });
};

var fn_tplPopovers = renderer.tplPopovers;
renderer.tplPopovers = function (lang, options) {
    var $popover = $(fn_tplPopovers.call(this, lang, options));

    var $imagePopover = $popover.find('.note-image-popover');
    var $linkPopover = $popover.find('.note-link-popover');
    var $airPopover = $popover.find('.note-air-popover');

    if (window === window.top) {
        $popover.children().addClass("hidden-xs");
    }

    //////////////// image popover

    // add center button for images
    var $centerbutton = $(tplIconButton('fa fa-align-center', {
            title: _t('Center'),
            event: 'floatMe',
            value: 'center'
        })).insertAfter($imagePopover.find('[data-event="floatMe"][data-value="left"]'));
    $imagePopover.find('button[data-event="removeMedia"]').parent().remove();
    $imagePopover.find('button[data-event="floatMe"][data-value="none"]').remove();

    var $alt = $('<div class="btn-group"/>');
    $alt.prependTo($imagePopover.find('.popover-content'));
    $alt.append('<button class="btn btn-default btn-sm btn-small" data-event="alt"><strong>Alt: </strong><span class="o_image_alt"></span></button>');

    // padding button
    var $padding = $('<div class="btn-group"/>');
    $padding.insertBefore($imagePopover.find('.btn-group:first'));
    var dropdown_content = [
        '<li><a data-event="padding" href="#" data-value="">'+_t('None')+'</a></li>',
        '<li><a data-event="padding" href="#" data-value="small">'+_t('Small')+'</a></li>',
        '<li><a data-event="padding" href="#" data-value="medium">'+_t('Medium')+'</a></li>',
        '<li><a data-event="padding" href="#" data-value="large">'+_t('Large')+'</a></li>',
        '<li><a data-event="padding" href="#" data-value="xl">'+_t('Xl')+'</a></li>',
    ];
    var $button = $(tplIconButton('fa fa-plus-square-o', {
            title: _t('Padding'),
            dropdown: tplDropdown(dropdown_content)
        })).appendTo($padding);

    // circle, boxed... options became toggled
    $imagePopover.find('[data-event="imageShape"]:not([data-value])').remove();
    var $button = $(tplIconButton('fa fa-sun-o', {
            title: _t('Shadow'),
            event: 'imageShape',
            value: 'shadow'
        })).insertAfter($imagePopover.find('[data-event="imageShape"][data-value="img-circle"]'));

    // add spin for fa
    var $spin = $('<div class="btn-group hidden only_fa"/>').insertAfter($button.parent());
    $(tplIconButton('fa fa-refresh', {
            title: _t('Spin'),
            event: 'imageShape',
            value: 'fa-spin'
        })).appendTo($spin);

    // resize for fa
    var $resizefa = $('<div class="btn-group hidden only_fa"/>')
        .insertAfter($imagePopover.find('.btn-group:has([data-event="resize"])'));
    for (var size=1; size<=5; size++) {
        $(tplButton('<span class="note-fontsize-10">'+size+'x</span>', {
          title: size+"x",
          event: 'resizefa',
          value: size+''
        })).appendTo($resizefa);
    }
    var $colorfa = $airPopover.find('.note-color').clone();
    $colorfa.find(".btn-group:first").remove();
    $colorfa.find("ul.dropdown-menu").css('min-width', '172px');
    $colorfa.find('button[data-event="color"]').attr('data-value', '{"foreColor": "#f00"}')
        .find("i").css({'background': '', 'color': '#f00'});
    $resizefa.after($colorfa);

    // show dialog box and delete
    var $imageprop = $('<div class="btn-group"/>');
    $imageprop.appendTo($imagePopover.find('.popover-content'));
    $(tplIconButton('fa fa-picture-o', {
            title: _t('Edit'),
            event: 'showImageDialog'
        })).appendTo($imageprop);
    $(tplIconButton('fa fa-trash-o', {
            title: _t('Remove'),
            event: 'delete'
        })).appendTo($imageprop);

    $imagePopover.find('.popover-content').append($airPopover.find(".note-history").clone());

    $imagePopover.find('[data-event="showImageDialog"]').before($airPopover.find('[data-event="showLinkDialog"]').clone());
    
    //////////////// link popover

    $linkPopover.find('.popover-content').append($airPopover.find(".note-history").clone());

    $linkPopover.find('button[data-event="showLinkDialog"] i').attr("class", "fa fa-link");
    $linkPopover.find('button[data-event="unlink"]').before($airPopover.find('button[data-event="showImageDialog"]').clone());

    //////////////// text/air popover

    //// highlight the text format
    $airPopover.find('.note-style').on('mousedown', function () {
        var $format = $airPopover.find('[data-event="formatBlock"]');
        var node = range.create().sc;
        var formats = $format.map(function () { return $(this).data("value"); }).get();
        while (node && (!node.tagName || (!node.tagName || formats.indexOf(node.tagName.toLowerCase()) === -1))) {
            node = node.parentNode;
        }
        $format.parent().removeClass('active');
        $format.filter('[data-value="'+(node ? node.tagName.toLowerCase() : "p")+'"]')
            .parent().addClass("active");
    });

    //////////////// tooltip

    setTimeout(function () {
        $airPopover.add($linkPopover).add($imagePopover).find("button")
            .tooltip('destroy')
            .tooltip({
                container: 'body',
                trigger: 'hover',
                placement: 'bottom'
            }).on('click', function () {$(this).tooltip('hide');});
    });

    return $popover;
};

var fn_boutton_update = eventHandler.modules.popover.button.update;
eventHandler.modules.popover.button.update = function ($container, oStyle) {
    // stop animation when edit content
    var previous = $(".note-control-selection").data('target');
    if (previous) {
        $(previous).css({"-webkit-animation-play-state": "", "animation-play-state": "", "-webkit-transition": "", "transition": "", "-webkit-animation": "", "animation": ""});
    }
    if (oStyle.image) {
        $(oStyle.image).css({"-webkit-animation": "none", "animation": "none"});
    }
    // end

    fn_boutton_update.call(this, $container, oStyle);

    $container.find('.note-color').removeClass("hidden");

    if (oStyle.image) {
        $container.find('[data-event]').parent().removeClass("active");

        $container.find('a[data-event="padding"][data-value="small"]').parent().toggleClass("active", $(oStyle.image).hasClass("padding-small"));
        $container.find('a[data-event="padding"][data-value="medium"]').parent().toggleClass("active", $(oStyle.image).hasClass("padding-medium"));
        $container.find('a[data-event="padding"][data-value="large"]').parent().toggleClass("active", $(oStyle.image).hasClass("padding-large"));
        $container.find('a[data-event="padding"][data-value="xl"]').parent().toggleClass("active", $(oStyle.image).hasClass("padding-xl"));
        $container.find('a[data-event="padding"][data-value=""]').parent().toggleClass("active", !$container.find('.active a[data-event="padding"]').length);

        if (dom.isImgFont(oStyle.image)) {

            $container.find('.btn-group:not(.only_fa):has(button[data-event="resize"],button[data-value="img-thumbnail"])').addClass("hidden");
            $container.find('.only_fa').removeClass("hidden");
            $container.find('button[data-event="resizefa"][data-value="2"]').toggleClass("active", $(oStyle.image).hasClass("fa-2x"));
            $container.find('button[data-event="resizefa"][data-value="3"]').toggleClass("active", $(oStyle.image).hasClass("fa-3x"));
            $container.find('button[data-event="resizefa"][data-value="4"]').toggleClass("active", $(oStyle.image).hasClass("fa-4x"));
            $container.find('button[data-event="resizefa"][data-value="5"]').toggleClass("active", $(oStyle.image).hasClass("fa-5x"));
            $container.find('button[data-event="resizefa"][data-value="1"]').toggleClass("active", !$container.find('.active[data-event="resizefa"]').length);

            $container.find('button[data-event="imageShape"][data-value="fa-spin"]').toggleClass("active", $(oStyle.image).hasClass("fa-spin"));
            $container.find('button[data-event="imageShape"][data-value="shadow"]').toggleClass("active", $(oStyle.image).hasClass("shadow"));

        } else {

            $container.find('.hidden:not(.only_fa)').removeClass("hidden");
            $container.find('.only_fa').addClass("hidden");
            var width = ($(oStyle.image).attr('style') || '').match(/(^|;|\s)width:\s*([0-9]+%)/);
            if (width) {
                width = width[2];
            }
            $container.find('button[data-event="resize"][data-value="1"]').toggleClass("active", width === "100%");
            $container.find('button[data-event="resize"][data-value="0.5"]').toggleClass("active", width === "50%");
            $container.find('button[data-event="resize"][data-value="0.25"]').toggleClass("active", width === "25%");

            $container.find('button[data-event="imageShape"][data-value="shadow"]').toggleClass("active", $(oStyle.image).hasClass("shadow"));

            if (!$(oStyle.image).is("img")) {
                $container.find('.btn-group:has(button[data-event="imageShape"])').addClass("hidden");
            }

            $container.find('.note-color').addClass("hidden");

        }

        $container.find('button[data-event="floatMe"][data-value="left"]').toggleClass("active", $(oStyle.image).hasClass("pull-left"));
        $container.find('button[data-event="floatMe"][data-value="center"]').toggleClass("active", $(oStyle.image).hasClass("center-block"));
        $container.find('button[data-event="floatMe"][data-value="right"]').toggleClass("active", $(oStyle.image).hasClass("pull-right"));

        $(oStyle.image).trigger('attributes_change');
    }
};

var fn_popover_update = eventHandler.modules.popover.update;
eventHandler.modules.popover.update = function ($popover, oStyle, isAirMode) {
    var $imagePopover = $popover.find('.note-image-popover');
    var $linkPopover = $popover.find('.note-link-popover');
    var $airPopover = $popover.find('.note-air-popover');

    fn_popover_update.call(this, $popover, oStyle, isAirMode);

    if (oStyle.image) {
        if (oStyle.image.parentNode.className.match(/(^|\s)media_iframe_video(\s|$)/i)) {
            oStyle.image = oStyle.image.parentNode;
        }
        var alt =  $(oStyle.image).attr("alt");

        $imagePopover.find('.o_image_alt').text( (alt || "").replace(/&quot;/g, '"') ).parent().toggle(oStyle.image.tagName === "IMG");
        $imagePopover.show();

        range.createFromNode(dom.firstChild(oStyle.image)).select();
    } else {
        $(".note-control-selection").hide();
    }

    if (oStyle.image || (oStyle.range && (!oStyle.range.isCollapsed() || (oStyle.range.sc.tagName && !dom.isAnchor(oStyle.range.sc)))) || (oStyle.image && !$(oStyle.image).closest('a').length)) {
        $linkPopover.hide();
        oStyle.anchor = false;
    }

    if (oStyle.image || oStyle.anchor || (oStyle.range && !$(oStyle.range.sc).closest('.note-editable').length)) {
        $airPopover.hide();
    } else {
        $airPopover.show();
    }
};

var fn_handle_update = eventHandler.modules.handle.update;
eventHandler.modules.handle.update = function ($handle, oStyle, isAirMode) {
    fn_handle_update.call(this, $handle, oStyle, isAirMode);
    if (oStyle.image) {
        $handle.find('.note-control-selection').hide();
    }
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////
/* hack for image and link editor */

function getImgTarget ($editable) {
    var $handle = $editable ? dom.makeLayoutInfo($editable).handle() : undefined;
    return $(".note-control-selection", $handle).data('target');
}
eventHandler.modules.editor.padding = function ($editable, sValue) {
    var $target = $(getImgTarget($editable));
    var paddings = "small medium large xl".split(/\s+/);
    $editable.data('NoteHistory').recordUndo();
    if (sValue.length) {
        paddings.splice(paddings.indexOf(sValue),1);
        $target.toggleClass('padding-'+sValue);
    }
    $target.removeClass("padding-" + paddings.join(" padding-"));
};
eventHandler.modules.editor.resize = function ($editable, sValue) {
    var $target = $(getImgTarget($editable));
    $editable.data('NoteHistory').recordUndo();
    var width = ($target.attr('style') || '').match(/(^|;|\s)width:\s*([0-9]+)%/);
    if (width) {
        width = width[2]/100;
    }
    $target.css('width', width != sValue ? (sValue * 100) + '%' : '');
};
eventHandler.modules.editor.resizefa = function ($editable, sValue) {
    var $target = $(getImgTarget($editable));
    $editable.data('NoteHistory').recordUndo();
    $target.attr('class', $target.attr('class').replace(/\s*fa-[0-9]+x/g, ''));
    if (+sValue > 1) {
        $target.addClass('fa-'+sValue+'x');
    }
};
eventHandler.modules.editor.floatMe = function ($editable, sValue) {
    var $target = $(getImgTarget($editable));
    $editable.data('NoteHistory').recordUndo();
    switch (sValue) {
        case 'center': $target.toggleClass('center-block').removeClass('pull-right pull-left'); break;
        case 'left': $target.toggleClass('pull-left').removeClass('pull-right center-block'); break;
        case 'right': $target.toggleClass('pull-right').removeClass('pull-left center-block'); break;
    }
};
eventHandler.modules.editor.imageShape = function ($editable, sValue) {
    var $target = $(getImgTarget($editable));
    $editable.data('NoteHistory').recordUndo();
    $target.toggleClass(sValue);
};

eventHandler.modules.linkDialog.showLinkDialog = function ($editable, $dialog, linkInfo) {
    $editable.data('range').select();
    $editable.data('NoteHistory').recordUndo();
    
    var editor = new widgets.LinkDialog($editable, linkInfo);
    editor.appendTo(document.body);

    var def = new $.Deferred();
    editor.on("save", this, function (linkInfo) {
        linkInfo.range.select();
        $editable.data('range', linkInfo.range);
        def.resolve(linkInfo);
        $editable.trigger('keyup');
        $('.note-popover .note-link-popover').show();
    });
    editor.on("cancel", this, function () {
        def.reject();
    });
    return def;
};
eventHandler.modules.imageDialog.showImageDialog = function ($editable) {
    var r = $editable.data('range');
    if (r.sc.tagName && r.sc.childNodes.length) {
        r.sc = r.sc.childNodes[r.so];
    }
    var editor = new widgets.MediaDialog($editable, dom.isImg(r.sc) ? r.sc : null);
    editor.appendTo(document.body);
    return new $.Deferred().reject();
};
pluginEvents.alt = function (event, editor, layoutInfo, sorted) {
    var $editable = layoutInfo.editable();
    var $selection = layoutInfo.handle().find('.note-control-selection');
    var media = $selection.data('target');
    new widgets.alt($editable, media).appendTo(document.body);
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////

var fn_is_void = dom.isVoid;
dom.isVoid = function (node) {
    return fn_is_void(node) || dom.isImgFont(node) || (node && node.className && node.className.match(/(^|\s)media_iframe_video(\s|$)/i));
};
dom.isImg = function (node) {
    return dom.isImgFont(node) || (node && (node.nodeName === "IMG" || (node.className && node.className.match(/(^|\s)(media_iframe_video|o_image)(\s|$)/i)) ));
};
dom.isForbiddenNode = function (node) {
    return $(node).is(".media_iframe_video, .fa, img");
};

dom.isImgFont = function (node) {
    var nodeName = node && node.nodeName.toUpperCase();
    var className = (node && node.className || "");
    if (node && (nodeName === "SPAN" || nodeName === "I") && className.length) {
        var classNames = className.split(/\s+/);
        for (var k=0; k<widgets.fontIcons.length; k++) {
            if (_.intersection(widgets.fontIcons[k].alias, classNames).length) {
                return true;
            }
        }
    }
    return false;
};
// re-overwrite font to include theme icons
var isFont = dom.isFont;
dom.isFont = function (node) {
    return dom.isImgFont(node) || isFont(node);
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////

var fn_visible = pluginEvents.visible;
pluginEvents.visible = function (event, editor, layoutInfo) {
    var res = fn_visible.call(this, event, editor, layoutInfo);
    var rng = range.create();
    if(!rng) return res;
    var $node = $(dom.node(rng.sc));
    if (($node.is('[data-oe-type="html"]') || $node.is('[data-oe-field="arch"]')) &&
        $node.hasClass("o_editable") &&
        !$node[0].children.length &&
        "h1 h2 h3 h4 h5 h6 p b bold i u code sup strong small pre th td".toUpperCase().indexOf($node[0].nodeName) === -1) {
        var p = $('<p><br/></p>')[0];
        $node.append( p );
        range.createFromNode(p.firstChild).select();
    }
    return res;
};


dom.check_unvalid_preview = function(value) {
    return /\n\s*(%|\{%)\s*\S+/.test(value); // jinja test
};
dom.html = function ($dom, prettifyHtml) {
    var html = $dom.html().trim();
    var result = '',
        level = 0,
        get_space = function (level) {
            var i = level, space = '';
            while (i--) space += '  ';
            return space;
        },
        reg = /^<\/?(a|span|font|strong|u|i|strong|b|td|p)(\s|>)/i,
        inline_level = Infinity,
        tokens = _.compact(_.flatten(_.map(html.split(/</), function (value) {
            value = value.replace(/\s+/g, ' ').split(/>/);
            value[0] = /\S/.test(value[0]) ? '<' + value[0] + '>' : '';
            return value;
        })));

    // reduce => merge inline style + text

    for (var i = 0, l = tokens.length; i < l; i++) {
        var token = tokens[i];
        var inline_tag = reg.test(token);
        var inline = inline_tag || inline_level <= level;

        if (token[0] === '<' && token[1] === '/') {
            if (inline_tag && inline_level === level) {
                inline_level = Infinity;
            }
            level--;
        }

        if (!inline && !/\S/.test(token)) {
            continue;
        }
        if (!inline || (token[1] !== '/' && inline_level > level)) {
            result += get_space(level);
        }

        if (token[0] === '<' && token[1] !== '/') {
            level++;
            if (inline_tag && inline_level > level) {
                inline_level = level;
            }
        }

        if (token.match(/^<(img|hr|br)/)) {
            level--;
        }

        result += token.trim().replace(/\s+/, ' ');

        if (inline_level > level) {
            result += '\n';
        }
    }
    return result;
};
dom.value = function ($node, stripLinebreaks) {
  var val = dom.isTextarea($node[0]) ? $node.val() : $node.html();
  if (stripLinebreaks) {
    return val.replace(/\s*[\n\r]+\s*/g, '');
  }
  return val;
};
pluginEvents.codeview = function (event, editor, layoutInfo) {
    if (event.isDefaultPrevented()) {
        return;
    }
    var $editor = layoutInfo.editable();
    var $codable = layoutInfo.codable ? layoutInfo.codable() : $editor.prev('textarea');

    $codable.prev('.check_unvalid_preview').remove();
    if ($editor.hasClass('codeview') && dom.check_unvalid_preview($codable.val())) {
        var $unvalid = $('<div class="check_unvalid_preview" style="color: #a94442; background-color: #f2dede; border-color: #ebccd1; padding: 15px; border-radius: 4px;"/>');
        $codable.before($unvalid.text(_t("You can't use html preview when you use non html code (like jinja)")));
        setTimeout(function () {
            $unvalid.fadeOut();
        }, 1000);
        return;
    }

    var prettifyHtml = $editor.data('options').prettifyHtml;

    // getter
    $editor.data('codesource', function () {
        return $editor.hasClass('codeview') ?
            (layoutInfo.codable ? layoutInfo.codable() : $editor.prev('textarea')).val() :
            dom.html($editor, prettifyHtml);
    });

    if (layoutInfo.toolbar) {
        var codeview = eventHandler.modules.codeview.toggle(layoutInfo);
        if (codeview) {
            $codable.val(dom.html($editor, prettifyHtml));
        } else {
            $editor.html(dom.value($codable, prettifyHtml, $editor));
            $editor.trigger('content_changed');
        }
    } else {
        var $textarea = $editor.prev('textarea.codesource');

        if (!$textarea.length) {
            // init and create texarea
            $editor.parent().css({
                'position': 'absolute',
                'top': 0,
                'bottom': 0,
                'left': 0,
                'right': 0
            });
            $textarea = $('<textarea class="codesource"/>').css({
                'margin': '0 -4px',
                'padding': '0 4px',
                'border': 0,
                'top': '51px',
                'left': '620px',
                'width': '100%',
                'font-family': 'sans-serif',
                'font-size': '13px',
                'height': '98%',
                'white-space': 'pre',
                'word-wrap': 'normal',
                'display': 'none',
            });
            $editor.before($textarea);
        }

        if (!$editor.hasClass('codeview')) {
            setTimeout(function () {
                layoutInfo.popover().find('button:not([data-event="codeview"])').addClass('hidden');
            }, 10);
            var html = dom.html($editor, prettifyHtml);
            $textarea.val(html).data('indexOfnit', html);
            $textarea.show();
            $editor.addClass('codeview').hide();
        } else {
            layoutInfo.popover().find('button:not([data-event="codeview"])').removeClass('hidden');
            // save changes
            $editor.html(dom.value($textarea, prettifyHtml, $editor));
            $textarea.hide();
            $editor.removeClass('codeview').show();
            if ($textarea.data('indexOfnit') != $textarea.val()) {
                $editor.trigger('content_changed');

            }
        }
    }
};


//////////////////////////////////////////////////////////////////////////////////////////////////////////
/* fix ie and re-range to don't break snippet*/

var initial_data = {};
function reRangeSelectKey (event) {
    initial_data.range = null;
    if (event.shiftKey && event.keyCode >= 37 && event.keyCode <= 40 && !$(event.target).is("input, textarea, select")) {
        var r = range.create();
        if (r) {
            var rng = r.reRange(event.keyCode <= 38);
            if (r !== rng) {
                rng.select();
            }
        }
    }
}
function reRangeSelect (event, dx, dy) {
    var r = range.create();
    if (!r || r.isCollapsed()) return;

    // check if the user move the caret on up or down
    var data = r.reRange(dy < 0 || (dy === 0 && dx < 0));

    if (data.sc !== r.sc || data.so !== r.so || data.ec !== r.ec || data.eo !== r.eo) {
        setTimeout(function () {
            data.select();
            $(data.sc.parentNode).closest('.note-popover');
        },0);
    }

    $(data.sc).closest('.o_editable').data('range', r);
    return r;
}
function summernote_mouseup (event) {
    if ($(event.target).closest("#web_editor-top-navbar, .note-popover").length) {
        return;
    }
    // don't rerange if simple click
    if (initial_data.event) {
        var dx = event.clientX - (event.shiftKey && initial_data.rect ? initial_data.rect.left : initial_data.event.clientX);
        var dy = event.clientY - (event.shiftKey && initial_data.rect ? initial_data.rect.top : initial_data.event.clientY);
        if (10 < Math.pow(dx, 2)+Math.pow(dy, 2)) {
            reRangeSelect(event, dx, dy);
        }
    }

    if (!$(event.target).closest(".o_editable").length) {
        return;
    }
    if (!initial_data.range || !event.shiftKey) {
        setTimeout(function () {
            initial_data.range = range.create();
        },0);
    }
}
var remember_selection;
function summernote_mousedown (event) {
    rte.history.splitNext();

    var $editable = $(event.target).closest(".o_editable, .note-editor");
    
    if (!!document.documentMode) {
        summernote_ie_fix(event, function (node) { return node.tagName === "DIV" || node.tagName === "IMG" || (node.dataset && node.dataset.oeModel); });
    } else if (last_div && event.target !== last_div) {
        if (last_div.tagName === "A") {
            summernote_ie_fix(event, function (node) { return node.dataset && node.dataset.oeModel; });
        } else if ($editable.length) {
            if (summernote_ie_fix(event, function (node) { return node.tagName === "A"; })) {
                var r = range.create();
                r.select();
            }
        }
    }

    // restore range if range lost after clicking on non-editable area
    var r = range.create();
    var editables = $(".o_editable[contenteditable], .note-editable[contenteditable]");
    var r_editable = editables.has((r||{}).sc);
    if (!r_editable.closest('.note-editor').is($editable) && !r_editable.filter('.o_editable').is(editables)) {
        var saved_editable = editables.has((remember_selection||{}).sc);
        if($editable.length && !saved_editable.closest('.o_editable, .note-editor').is($editable)) {
            remember_selection = range.create(dom.firstChild($editable[0]), 0);
        } else if(!saved_editable.length) {
            remember_selection = undefined;
        }
        if(remember_selection) {
            try {
                remember_selection.select();
            } catch (e) {
                console.warn(e);
            }
        }
    } else if(r_editable.length) {
        remember_selection = r;
    }

    initial_data.event = event;

    // keep selection when click with shift
    if (event.shiftKey && $editable.length) {
        if (initial_data.range) {
            initial_data.range.select();
        }
        var rect = r && r.getClientRects();
        initial_data.rect = rect && rect.length ? rect[0] : { top: 0, left: 0 };
    }
}

var last_div;
var last_div_change;
var last_editable;
function summernote_ie_fix (event, pred) {
    var editable;
    var div;
    var node = event.target;
    while(node.parentNode) {
        if (!div && pred(node)) {
            div = node;
        }
        if(last_div !== node && (node.getAttribute('contentEditable')==='false' || node.className && (node.className.indexOf('o_not_editable') !== -1))) {
            break;
        }
        if (node.className && node.className.indexOf('o_editable') !== -1) {
            if (!div) {
                div = node;
            }
            editable = node;
            break;
        }
        node = node.parentNode;
    }

    if (!editable) {
        $(last_div_change).removeAttr("contentEditable").removeProp("contentEditable");
        $(last_editable).attr("contentEditable", "true").prop("contentEditable", "true");
        last_div_change = null;
        last_editable = null;
        return;
    }

    if (div === last_div) {
        return;
    }

    last_div = div;

    $(last_div_change).removeAttr("contentEditable").removeProp("contentEditable");

    if (last_editable !== editable) {
        if ($(editable).is("[contentEditable='true']")) {
           $(editable).removeAttr("contentEditable").removeProp("contentEditable");
            last_editable = editable;
        } else {
            last_editable = null;
        }
    }
    if (!$(div).attr("contentEditable") && !$(div).is("[data-oe-type='many2one'], [data-oe-type='contact']")) {
        $(div).attr("contentEditable", "true").prop("contentEditable", "true");
        last_div_change = div;
    } else {
        last_div_change = null;
    }
    return editable !== div ? div : null;
}

var fn_attach = eventHandler.attach;
eventHandler.attach = function (oLayoutInfo, options) {
    fn_attach.call(this, oLayoutInfo, options);
    var $editor = oLayoutInfo.editor();

    $editor.on('dragstart', 'img', function (e) { e.preventDefault(); });
    $(document).on('mousedown', summernote_mousedown);
    $(document).on('mouseup', summernote_mouseup);
    $editor.off('click').on('click', function (e) {e.preventDefault();}); // if the content editable is a link
    $editor.on('dblclick', 'img, .media_iframe_video, span.fa, i.fa, span.fa, a.o_image', function (event) {
        if (!$(event.target).closest(".note-toolbar").length) { // prevent icon edition of top bar for default summernote
            new widgets.MediaDialog($editor, event.target).appendTo(document.body);
        }
    });
    if($editor.is('[data-oe-model][data-oe-type="image"]')) {
        $editor.on('click', 'img', function (event) {
            $(event.target).trigger("dblclick");
        });
    }
    oLayoutInfo.editable().on('mousedown', function(e) {
        if(dom.isImg(e.target)) {
            range.createFromNode(e.target).select();
        }
    });
    $(document).on("keyup", reRangeSelectKey);
    var clone_data = false;

    // getter
    $editor.data('codesource', function () {
        return dom.html($editor, true);
    });

    if ($editor.data('oe-model') || $editor.data('oe-translation-id')) {
        $editor.on('content_changed', function () {
            var $nodes = $('[data-oe-model], [data-oe-translation-id]')
                .filter(function () { return this != $editor[0];});

            if ($editor.data('oe-model')) {
                $nodes = $nodes.filter('[data-oe-model="'+$editor.data('oe-model')+'"]')
                    .filter('[data-oe-id="'+$editor.data('oe-id')+'"]')
                    .filter('[data-oe-field="'+$editor.data('oe-field')+'"]');
            }
            if ($editor.data('oe-translation-id')) $nodes = $nodes.filter('[data-oe-translation-id="'+$editor.data('oe-translation-id')+'"]');
            if ($editor.data('oe-type')) $nodes = $nodes.filter('[data-oe-type="'+$editor.data('oe-type')+'"]');
            if ($editor.data('oe-expression')) $nodes = $nodes.filter('[data-oe-expression="'+$editor.data('oe-expression')+'"]');
            if ($editor.data('oe-xpath')) $nodes = $nodes.filter('[data-oe-xpath="'+$editor.data('oe-xpath')+'"]');
            if ($editor.data('oe-contact-options')) $nodes = $nodes.filter('[data-oe-contact-options="'+$editor.data('oe-contact-options')+'"]');

            var nodes = $editor.get();

            if ($editor.data('oe-type') === "many2one") {
                $nodes = $nodes.add($('[data-oe-model]')
                    .filter(function () { return this != $editor[0] && nodes.indexOf(this) === -1; })
                    .filter('[data-oe-many2one-model="'+$editor.data('oe-many2one-model')+'"]')
                    .filter('[data-oe-many2one-id="'+$editor.data('oe-many2one-id')+'"]')
                    .filter('[data-oe-type="many2one"]'));

                $nodes = $nodes.add($('[data-oe-model]')
                    .filter(function () { return this != $editor[0] && nodes.indexOf(this) === -1; })
                    .filter('[data-oe-model="'+$editor.data('oe-many2one-model')+'"]')
                    .filter('[data-oe-id="'+$editor.data('oe-many2one-id')+'"]')
                    .filter('[data-oe-field="name"]'));
            }

            if (!clone_data) {
                clone_data = true;
                $nodes.html(this.innerHTML);
                clone_data = false;
            }
        });
    }

    var custom_toolbar = oLayoutInfo.toolbar ? oLayoutInfo.toolbar() : undefined;
    var $toolbar = $(oLayoutInfo.popover()).add(custom_toolbar);
    $('button[data-event="undo"], button[data-event="redo"]', $toolbar).attr('disabled', true);

    $($editor)
        .add(oLayoutInfo.handle())
        .add(oLayoutInfo.popover())
        .add(custom_toolbar)
        .on('click content_changed', function () {
            $('button[data-event="undo"]', $toolbar).attr('disabled', !oLayoutInfo.editable().data('NoteHistory').hasUndo());
            $('button[data-event="redo"]', $toolbar).attr('disabled', !oLayoutInfo.editable().data('NoteHistory').hasRedo());
        });
};
var fn_detach = eventHandler.detach;
eventHandler.detach = function (oLayoutInfo, options) {
    fn_detach.call(this, oLayoutInfo, options);
    oLayoutInfo.editable().off('mousedown');
    oLayoutInfo.editor().off("dragstart");
    oLayoutInfo.editor().off('click');
    $(document).off('mousedown', summernote_mousedown);
    $(document).off('mouseup', summernote_mouseup);
    oLayoutInfo.editor().off("dblclick");
    $(document).off("keyup", reRangeSelectKey);
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////
/* Translation for odoo */

$.summernote.lang.odoo = {
    font: {
      bold: _t('Bold'),
      italic: _t('Italic'),
      underline: _t('Underline'),
      strikethrough: _t('Strikethrough'),
      subscript: _t('Subscript'),
      superscript: _t('Superscript'),
      clear: _t('Remove Font Style'),
      height: _t('Line Height'),
      name: _t('Font Family'),
      size: _t('Font Size')
    },
    image: {
      image: _t('Picture'),
      insert: _t('Insert Image'),
      resizeFull: _t('Resize Full'),
      resizeHalf: _t('Resize Half'),
      resizeQuarter: _t('Resize Quarter'),
      floatLeft: _t('Float Left'),
      floatRight: _t('Float Right'),
      floatNone: _t('Float None'),
      dragImageHere: _t('Drag an image here'),
      selectFromFiles: _t('Select from files'),
      url: _t('Image URL'),
      remove: _t('Remove Image')
    },
    link: {
      link: _t('Link'),
      insert: _t('Insert Link'),
      unlink: _t('Unlink'),
      edit: _t('Edit'),
      textToDisplay: _t('Text to display'),
      url: _t('To what URL should this link go?'),
      openInNewWindow: _t('Open in new window')
    },
    video: {
      video: _t('Video'),
      videoLink: _t('Video Link'),
      insert: _t('Insert Video'),
      url: _t('Video URL?'),
      providers: _t('(YouTube, Vimeo, Vine, Instagram, DailyMotion or Youku)')
    },
    table: {
      table: _t('Table')
    },
    hr: {
      insert: _t('Insert Horizontal Rule')
    },
    style: {
      style: _t('Style'),
      normal: _t('Normal'),
      blockquote: _t('Quote'),
      pre: _t('Code'),
      h1: _t('Header 1'),
      h2: _t('Header 2'),
      h3: _t('Header 3'),
      h4: _t('Header 4'),
      h5: _t('Header 5'),
      h6: _t('Header 6')
    },
    lists: {
      unordered: _t('Unordered list'),
      ordered: _t('Ordered list')
    },
    options: {
      help: _t('Help'),
      fullscreen: _t('Full Screen'),
      codeview: _t('Code View')
    },
    paragraph: {
      paragraph: _t('Paragraph'),
      outdent: _t('Outdent'),
      indent: _t('Indent'),
      left: _t('Align left'),
      center: _t('Align center'),
      right: _t('Align right'),
      justify: _t('Justify full')
    },
    color: {
      recent: _t('Recent Color'),
      more: _t('More Color'),
      background: _t('Background Color'),
      foreground: _t('Foreground Color'),
      transparent: _t('Transparent'),
      setTransparent: _t('Set transparent'),
      reset: _t('Reset'),
      resetToDefault: _t('Reset to default')
    },
    shortcut: {
      shortcuts: _t('Keyboard shortcuts'),
      close: _t('Close'),
      textFormatting: _t('Text formatting'),
      action: _t('Action'),
      paragraphFormatting: _t('Paragraph formatting'),
      documentStyle: _t('Document Style')
    },
    history: {
      undo: _t('Undo'),
      redo: _t('Redo')
    }
};

return $.summernote;

});
