// selection.js
// =============


(function(root) {
    var selection;

    function Selection(inputor, type) {
        this.element = inputor;

        this.cursor = function(start, end) {
            // get cursor
            var inputor = this.element;
            if (typeof start == 'undefined') {
                if (type === 'input') {
                    return [inputor.selectionStart, inputor.selectionEnd];
                }
                if (type === 'input-ie') {
                    return getIECursor(inputor);
                }
            }

            // set cursor
            if (isArray(start)) {
                var _s = start;
                start = _s[0];
                end = _s[1];
            }
            if (typeof end === 'undefined') end = start;
            if (type === 'input') {
                inputor.setSelectionRange(start, end);
            } else if (type === 'input-ie') {
                setIECursor(inputor, start, end);
            }
            return this;
        }

        if (type === 'input' || type === 'input-ie') {
            // get or set selected text
            this.text = function(text) {
                var inputor = this.element;
                var cursor = this.cursor();
                if (typeof text == 'undefined') {
                    return inputor.value.slice(cursor[0], cursor[1]);
                }
                return insertText(this, text, cursor[0], cursor[1]);
            }

            // append text to the end
            this.append = function(text) {
                var end = this.cursor()[1];
                return insertText(this, text, end, end);
            }

            this.prepend = function(text) {
                var start = this.cursor()[0];
                return insertText(this, text, start, start);
            }

            this.surround = function(count) {
                if (typeof count == 'undefined') count = 1;
                var value = this.element.value;
                var cursor = this.cursor();
                var before = value.slice(Math.max(0, cursor[0] - count),
                                         cursor[0]);
                var after = value.slice(cursor[1], cursor[1] + count);
                return [before, after];
            }

            this.line = function() {
                var value = this.element.value;
                var cursor = this.cursor();
                var before = value.slice(0, cursor[0]).lastIndexOf('\n');
                var after = value.slice(cursor[1]).indexOf('\n');

                // we don't need \n
                var start = before + 1;
                if (after === -1) {
                    return value.slice(start);
                }
                var end = cursor[1] + after;
                return value.slice(start, end);
            }
        }
        return this;
    }

    selection = function(inputor) {
        if (inputor && inputor.length) {
            // if inputor is jQuery or zepto or a list of elements
            inputor = inputor[0];
        }
        if (inputor) {
            if (typeof inputor.selectionStart != 'undefined') {
                return new Selection(inputor, 'input');
            } else {
                return new Selection(inputor, 'input-ie');
            }
        }
        if (typeof document == 'undefined') throw 'document undefined';

        if (document.selection) return new Selection(document, 'document-ie');
        if (document.getSelection) return new Selection(document, 'document');
        return new Selection(inputor, 'none');
    }

    // Helpers
    // -------------


    var toString = Object.prototype.toString;
    var isArray = Array.isArray;
    if (!isArray) {
        isArray = function(val) {
            return toString.call(val) === '[object Array]';
        }
    }
    var isFunction = function(val) {
        return toString.call(val) === '[object Function]';
    }

    // IE sucks. This is how to get cursor position in IE.
    function getIECursor(inputor) {
        var range = document.selection.createRange();
        var pos = 0;
        if (range && range.parentElement() === inputor) {
            var start, end;
            var normalizedValue = inputor.value.replace(/\r\n/g, '\n');
            var len = normalizedValue.length;
            var textInputRange = inputor.createTextRange();
            textInputRange.moveToBookmark(range.getBookmark());
            var endRange = inputor.createTextRange();
            endRange.collapse(false);
            if (textInputRange.compareEndPoints('StartToEnd', endRange) > -1) {
                start = end = len;
            } else {
                start = -textInputRange.moveStart('character', -len);
                end = -textInputRange.moveEnd('character', -len);
            }
            return [start, end];
        }
        return [0, 0];
    }

    function setIECursor(inputor, start, end) {
        var range = inputor.createTextRange();
        range.move('character', start);
        // don't include the last one character
        range.moveEnd('character', end - 1);
        range.select();
    }

    function insertText(selection, text, start, end) {
        if (typeof text == 'undefined') text = '';
        var value = selection.element.value;
        selection.element.value = [
            value.slice(0, start), text, value.slice(end)
        ].join('');
        end = start + text.length;
        selection.cursor(start, end);
        return selection;
    }

    // CommonJS compatable
    if (typeof module !== 'undefined') {
        module.exports = selection;
    } else {
        root.selection = selection;
    }
})(this);
