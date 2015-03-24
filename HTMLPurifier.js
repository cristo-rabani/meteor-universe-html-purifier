var allowHeaders = true;
var stack = [];
var active_elements = [];
var customTags = {};
var root;
var insertion_mode;
var noFormatting;
var preferB_I = false;
var preferStrong_Em = false;
var withoutTags;


var scope_markers = {'td': true, 'th': true, 'caption': true};
var tags_with_implied_end = {'li': true, 'p': true};
var allowed_attributes = {
    all_elements: ['class', 'style', 'id'],
    a: ['href', 'target', 'title', 'name', 'rel', 'rev', 'type'],
    blockquote: ['cite'],
    img: ['src', 'alt', 'title', 'longdesc'],
    td: ['colspan'],
    th: ['colspan'],
    tr: ['rowspan'],
    table: ['border']
};
var allowed_attributes_as_hash;
var selfClosing = {
    br: true,
    hr: true,
    img: true
};
var dontIndent = {
    strong: true,
    b: true,
    i: true,
    em: true,
    pre: true
};
var indent = false;
var indent_string = "    ";
var indentation = function (depth, switchOff) {
    if (noFormatting) return "";
    if (!indent) return "";
    if (switchOff) indent = false;
    var result = "\n";
    for (var i = 0; i < depth; i++) {
        result += indent_string;
    }
    return result;
};

var TextNode = function (text) {
    this.text = text.replace(/\s+/g, ' ');
};

TextNode.prototype = {
    isEmpty: function () {
        return !this.text;
    },
    textContent: function () {
        return this.text;
    },
    toString: function () {
        return this.isEmpty() ? '' : indentation(this.depth(), true) + this.text.replace(/(&nbsp;)+/, ' ');
    },
    depth: function () {
        return this.parent.depth() + 1;
    }
};

var Node = function (name) {
    this.name = name;
    this.children = [];
    this.attributes = {};
};

Node.prototype = {
    appendChild: function (child) {
        this.children.push(child);
        child.parent = this;
        return child;
    },
    removeChild: function (child) {
        for (var i = 0, len = this.children.length; i < len; i++) {
            if (this.children[i] === child) {
                return this.children.splice(i, i);
            }
        }
        return null;
    },
    lastChild: function () {
        return this.children[this.children.length - 1];
    },
    clone: function () {
        var clone = new Node(this.name);
        for (var i in this.attributes) {
            clone.attributes[i] = this.attributes[i];
        }
        return clone;
    },
    startTag: function () {
        return "<" + this.name + this.attributeString() + ">";
    },
    endTag: function () {
        return "</" + this.name + ">";
    },
    selfClosingTag: function () {
        return "<" + this.name + this.attributeString() + "/>";
    },
    attributeString: function () {
        var string = "";

        var allowed_for_tag = allowed_attributes_as_hash[this.name] || {};
        var allowed_for_all = allowed_attributes_as_hash['all_elements'] || {};

        for (var i = 0, len = (this.attributes || []).length; i < len; i++) {
            var name = this.attributes[i].name;
            var value = this.attributes[i].value;
            if ((allowed_for_tag[name] || allowed_for_all[name]) && value) {
                if (name === 'href') {
                    // don't allow links to anywhere other than http(s)
                    // because they could contain JavaScript (javascript:) or other bad things!
                    var permittedRegex = /^https?:\/\//i;
                    if (!permittedRegex.test(value)) {
                        // if not allowed, set the attribute to be empty
                        value = '';
                    }
                }

                string += " " + name + "=\"" + value + "\"";
            }
        }
        return string;
    },
    innerHTML: function () {
        var string = "";
        for (var i = 0, len = this.children.length; i < len; i++) {
            string += this.children[i];
        }
        return string;
    },
    textContent: function () {
        var text = "";
        for (var i = 0, len = this.children.length; i < len; i++) {
            if (this.children[i] instanceof TextNode) {
                text += this.children[i].text;
            }
        }
        return text;
    },
    toString: function () {
        if (this.isEmpty()) return '';

        var string = "";
        if (selfClosing[this.name]) {
            string = indentation(this.depth(), true) + this.selfClosingTag();
        } else {
            indent = dontIndent[this.name] ? indent : true;
            string = indentation(this.depth(), dontIndent[this.name]) + this.startTag() + this.innerHTML();
            indent = dontIndent[this.name] ? indent : true;
            string += indentation(this.depth()) + this.endTag();
        }
        return string;
    },
    depth: function () {
        return this.parent ? this.parent.depth() + 1 : -1;
    },
    isEmpty: function () {
        // Zaption mod: self-closing elements never count as empty
        // otherwise <p><br/></p> gets removed entirely
        if (selfClosing[this.name]) {
            return false;
        }

        if (typeof(this._isEmpty) === "undefined") {
            this._isEmpty = true;
            for (var i = 0, len = this.children.length; i < len; i++) {
                if (!this.children[i].isEmpty()) {
                    this._isEmpty = false;
                    break;
                }
            }
        }
        return this._isEmpty;
    }
};

function init(settings) {
    root = new Node('html');
    stack = [root];
    active_elements = [];
    allowed_attributes_as_hash = {};
    var attr, i;
    for (var key in allowed_attributes) {
        allowed_attributes_as_hash[key] = {};
        for (i in allowed_attributes['all_elements']) {
            attr = allowed_attributes['all_elements'][i];
            allowed_attributes_as_hash[key][attr] = true;
        }
        if (key === 'all_elements') {
            continue;
        }
        for (i in allowed_attributes[key]) {
            attr = allowed_attributes[key][i];
            allowed_attributes_as_hash[key][attr] = true;
        }
    }

    noFormatting = !!settings.noFormatting;
    preferStrong_Em = !!settings.preferStrong_Em;
    preferB_I = !preferStrong_Em && !!settings.preferB_I;
    allowHeaders = !settings.noHeaders;
    withoutTags = {};

    if(typeof settings.withoutTags === 'string' && settings.withoutTags){
        settings.withoutTags = [settings.withoutTags];
    }

    if(settings.withoutTags && settings.withoutTags.length){
        for (var i = settings.withoutTags.length -1 ; i >= 0; i--) {
            withoutTags[settings.withoutTags[i]] = true;
        }
    }
}

function last_el(list) {
    var len = list.length;
    if (len === 0) {
        return null;
    }
    return list[len - 1];
}

function in_array(arr, elem) {
    for (var i = 0; i < arr.length; i++) {
        if (arr[i] === elem) return true;
    }
    return false;
}

function current_node() {
    return last_el(stack);
}

function reconstruct_the_active_formatting_elements() {
    if (active_elements.length === 0 || in_array(stack, last_el(active_elements))) {
        return;
    }
    var entry;
    for (var i = active_elements.length; i > 0; i--) {
        entry = active_elements[i - 1];
        if (in_array(stack, entry)) {
            break;
        }
    }
    do {
        var clone = entry.clone();
        current_node().appendChild(clone);
        stack.push(clone);
        active_elements[i] = clone;
        i += 1;
    } while (i !== active_elements.length);
}

function has_element_with(arr_of_elements, tagName) {
    for (var i = arr_of_elements.length; i > 0; i--) {
        if (arr_of_elements[i - 1].name === tagName) {
            return true;
        }
    }
    return false;
}

function in_scope(tagName) {
    return has_element_with(stack, tagName);
}

function in_table_scope(tagName) {
    for (var i = stack.length; i > 0; i--) {
        var nodeTag = stack[i - 1].name;
        if (nodeTag === tagName) {
            return true;
        } else if (nodeTag === 'table' || nodeTag === 'html') {
            return false;
        }
    }
    return false;
}

function insert_html_element_for(tagName, attrs) {
    var node = new Node(tagName);
    node.attributes = attrs;
    current_node().appendChild(node);
    stack.push(node);
    return node;
}

function generate_implied_end_tags(exception) {
    var tagName = current_node().name;
    while (tags_with_implied_end[tagName] && tagName !== exception) {
        end(tagName);
        tagName = current_node().name;
    }
}

function trim_to_1_space(str) {
    return str.replace(/^\s+/, ' ').replace(/\s+$/, ' ');
}

function clear_stack_to_table_context() {
    clear_stack_to_context_by_tags(['table', 'html']);
}

function clear_stack_to_table_body_context() {
    clear_stack_to_context_by_tags(['tbody', 'tfoot', 'thead', 'html']);
}

function clear_stack_to_table_row_context() {
    clear_stack_to_context_by_tags(['tr', 'html']);
}

function clear_stack_to_context_by_tags(tags) {
    while (!in_array(tags, current_node().name)) {
        stack.pop();
    }
}

function clear_active_elements_to_last_marker() {
    var entry;
    do {
        entry = active_elements.pop();
    } while (!scope_markers[entry.name]);
}

function reset_insertion_mode() {
    var last = false;
    var node;
    for (var i = stack.length - 1; i >= 0; i--) {
        node = stack[i];
        if (node === stack[0]) {
            last = true;
        }
        switch (node.name) {
            case 'th':
            case 'td':
                if (!last) {
                    insertion_mode = InCell;
                    return;
                }
            case 'tr':
                insertion_mode = InRow;
                return;
            case 'tbody':
            case 'thead':
            case 'tfoot':
                insertion_mode = InTableBody;
                return;
            case 'caption':
                insertion_mode = InCaption;
                return;
            case 'colgroup':
                insertion_mode = InColumnGroup;
                return;
            case 'table':
                insertion_mode = InTable;
                return;
            default:
                if (last) {
                    insertion_mode = InBody;
                    return;
                }
        }
    }
}

function close_the_cell() {
    if (in_table_scope('td')) {
        end('td');
    } else {
        end('th');
    }
}

function start(tagName, attrs, unary) {
    insertion_mode.insertion_mode_start(tagName, attrs, unary);
}

function end(tagName) {
    insertion_mode.insertion_mode_end(tagName);
}

function chars(text) {
    if (typeof(text) === 'undefined') {
        return;
    }
    text = text.replace(/\n\s*\n\s*\n*/g, '\n\n').replace(/(^\n\n|\n\n$)/g, '');
    var paragraphs = text.split('\n\n');
    var trimmedText;
    if (paragraphs.length > 1) {
        for (var i in paragraphs) {
            start('p');
            reconstruct_the_active_formatting_elements();
            trimmedText = trim_to_1_space(paragraphs[i]);
            current_node().appendChild(new TextNode(trimmedText));
            end('p');
        }
    } else {
        if (text.match(/^\s*$/g) && current_node().children.length && current_node().lastChild().name === 'br') {
            return;
        }
        reconstruct_the_active_formatting_elements();
        trimmedText = trim_to_1_space(paragraphs[0]);
        current_node().appendChild(new TextNode(trimmedText));
    }
}

var InBody = {
    insertion_mode_start: function (tagName, attrs) {
        var node;
        tagName = tagName.toLowerCase();
        if (withoutTags[tagName]) {
            return;
        }
        if (preferStrong_Em) {
            switch (tagName) {
                case 'b':
                    start('strong');
                    return;
                case 'i':
                    start('em');
                    return;
            }
        } else if (preferB_I) {
            switch (tagName) {
                case 'strong':
                    start('b');
                    return;
                case 'em':
                    start('i');
                    return;
            }
        }
        switch (tagName) {
            case 'h1':
            case 'h2':
            case 'h3':
            case 'h4':
            case 'h5':
            case 'h6':
            case 'h7':
                if (!allowHeaders) {
                    start('p');
                    if (preferB_I) {
                        start('b');
                    } else {
                        start('strong');
                    }
                    return;
                }
            case 'blockquote':
            case 'ol':
            case 'p':
            case 'ul':
            case 'pre': // Techically PRE shouldn't be in this groups, since newlines should be ignored after a pre tag
                if (in_scope('p')) {
                    end('p');
                }
                insert_html_element_for(tagName, attrs);
                return;
            case 'li':
                if (in_scope('p')) {
                    end('p');
                }
                node = current_node();
                while (node.name === 'li') {
                    stack.pop();
                }
                insert_html_element_for(tagName, attrs);
                return;
            case 'a':
                for (var i = active_elements.length; i > 0; i--) {
                    if (active_elements[i - 1].name === 'a') {
                        end('a');
                        active_elements.splice(i - 1, 1);
                    }
                }
                reconstruct_the_active_formatting_elements();
                node = insert_html_element_for(tagName, attrs);
                active_elements.push(node);
                return;
            case 'strong':
            case 'b':
            case 'em':
            case 'i':
            case 'u':
            case 'span':
                reconstruct_the_active_formatting_elements();
                node = insert_html_element_for(tagName, attrs);
                active_elements.push(node);
                return;
            case 'table':
                if (in_scope('p')) {
                    end('p');
                }
                insert_html_element_for(tagName, attrs);
                insertion_mode = InTable;
                return;
            case 'br':
            case 'img':
                reconstruct_the_active_formatting_elements();
                insert_html_element_for(tagName, attrs);
                stack.pop();
                return;
        }
        if (customTags[tagName]) {
            if (selfClosing[tagName]) {
                reconstruct_the_active_formatting_elements();
                insert_html_element_for(tagName, attrs);
                stack.pop();
                return;
            } else {
                reconstruct_the_active_formatting_elements();
                node = insert_html_element_for(tagName, attrs);
                active_elements.push(node);
                return;
            }
        }
    },

    insertion_mode_end: function (tagName) {
        if (typeof tagName === 'undefined') {
            return;
        }
        var node;
        tagName = tagName.toLowerCase();
        if (!withoutTags[tagName]) {
            if (preferStrong_Em) {
                switch (tagName) {
                    case 'b':
                        end('strong');
                        return;
                    case 'i':
                        end('em');
                        return;
                }
            } else if (preferB_I) {
                switch (tagName) {
                    case 'strong':
                        end('b');
                        return;
                    case 'em':
                        end('i');
                        return;
                }
            }
            switch (tagName) {
                case 'h1':
                case 'h2':
                case 'h3':
                case 'h4':
                case 'h5':
                case 'h6':
                case 'h7':
                    if (!allowHeaders) {
                        if (preferB_I) {
                            end('b');
                        } else {
                            end('strong');
                        }
                        end('p');
                        return;
                    }
                    if (in_scope(tagName)) {
                        generate_implied_end_tags();
                        do {
                            node = stack.pop();
                        } while (node.name !== tagName);
                    }
                    return;
                case 'blockquote':
                case 'ol':
                case 'ul':
                case 'pre': // Techically PRE shouldn't be in this groups, since newlines should be ignored after a pre tag
                    if (in_scope(tagName)) {
                        generate_implied_end_tags();
                    }
                    if (in_scope(tagName)) {
                        do {
                            node = stack.pop();
                        } while (node.name !== tagName);
                    }
                    return;
                case 'p':
                    if (in_scope(tagName)) {
                        generate_implied_end_tags(tagName);
                    }
                    var no_p_in_scope = true;
                    while (in_scope(tagName)) {
                        no_p_in_scope = false;
                        node = stack.pop();
                    }
                    if (no_p_in_scope) {
                        start('p', [], false);
                        end('p');
                    }
                    return;
                case 'li':
                    if (in_scope(tagName)) {
                        generate_implied_end_tags(tagName);
                    }
                    if (in_scope(tagName)) {
                        do {
                            node = stack.pop();
                        } while (node.name !== tagName);
                    }
                    return;
                case 'a':
                case 'i':
                case 'em':
                case 'strong':
                case 'b':
                case 'u':
                case 'span':
                    for (var i = active_elements.length; i > 0; i--) {
                        if (active_elements[i - 1].name === tagName) {
                            node = active_elements[i - 1];
                            break;
                        }
                    }
                    if (typeof(node) === 'undefined' || !in_array(stack, node)) {
                        return;
                    }
                    // Step 2 from the algorithm in the HTML5 spec will never be necessary with the tags we allow
                    var popped_node;
                    do {
                        popped_node = stack.pop();
                    } while (popped_node !== node);
                    active_elements.splice(i - 1, 1);
                    return;

            }
            if (customTags[tagName] && !selfClosing[tagName]) {
                for (var i = active_elements.length; i > 0; i--) {
                    if (active_elements[i - 1].name === tagName) {
                        node = active_elements[i - 1];
                        break;
                    }
                }
                if (typeof(node) === 'undefined' || !in_array(stack, node)) {
                    return;
                }
                // Step 2 from the algorithm in the HTML5 spec will never be necessary with the tags we allow
                var popped_node;
                do {
                    popped_node = stack.pop();
                } while (popped_node !== node);
                active_elements.splice(i - 1, 1);
                return;
            }
        }
        node = current_node();
        if (node.name === tagName) {
            generate_implied_end_tags();
            while (stack.length > 0 && node !== current_node()) {
                stack.pop();
            }
        }
    }
};

var InTable = {
    insertion_mode_start: function (tagName, attrs, unary) {
        tagName = tagName.toLowerCase();
        switch (tagName) {
            case 'caption':
                clear_stack_to_table_context();
                active_elements.push(insert_html_element_for(tagName, attrs));
                insertion_mode = InCaption;
                return;
            case 'colgroup':
                clear_stack_to_table_context();
                insert_html_element_for(tagName, attrs);
                insertion_mode = InColumnGroup;
                return;
            case 'col':
                start('colgroup');
                start(tagName, attrs, unary);
                return;
            case 'tbody':
            case 'tfoot':
            case 'thead':
                clear_stack_to_table_context();
                insert_html_element_for(tagName, attrs);
                insertion_mode = InTableBody;
                return;
            case 'td':
            case 'th':
            case 'tr':
                start('tbody');
                start(tagName, attrs, unary);
                return;
        }
    },

    insertion_mode_end: function (tagName) {
        if (typeof(tagName) === undefined) {
            return;
        }
        tagName = tagName.toLowerCase();
        switch (tagName) {
            case 'table':
                if (in_table_scope('table')) {
                    var node;
                    do {
                        node = stack.pop();
                    } while (node.name !== 'table');
                }
                reset_insertion_mode();
                return;
        }
    }
};

var InCaption = {
    insertion_mode_start: function (tagName, attrs, unary) {
        tagName = tagName.toLowerCase();
        switch (tagName) {
            case 'caption':
            case 'col':
            case 'colgroup':
            case 'tbody':
            case 'td':
            case 'tfoot':
            case 'th':
            case 'thead':
            case 'tr':
                end('caption');
                start(tagName);
                return;
            default:
                InBody.insertion_mode_start(tagName, attrs, unary);
                return;
        }
    },

    insertion_mode_end: function (tagName) {
        if (typeof(tagName) === undefined) {
            return;
        }
        tagName = tagName.toLowerCase();
        switch (tagName) {
            case 'caption':
                if (in_table_scope('caption')) {
                    generate_implied_end_tags();
                    if (current_node().name === 'caption') {
                        var node;
                        do {
                            node = stack.pop();
                        } while (node.name !== 'caption');
                        clear_active_elements_to_last_marker();
                        insertion_mode = InTable;
                    }
                }
                return;
            case "body":
            case "col":
            case "colgroup":
            case "html":
            case "tbody":
            case "td":
            case "tfoot":
            case "th":
            case "thead":
            case "tr":
                return;
            case 'table':
                end('caption');
                end('table');
                return;
            default:
                InBody.insertion_mode_end(tagName);
                return;
        }
    }
};

var InColumnGroup = {
    insertion_mode_start: function (tagName, attrs, unary) {
        tagName = tagName.toLowerCase();
        switch (tagName) {
            case 'html':
                InBody.insertion_mode_start(tagName, attrs, unary);
                return;
            case 'col':
                insert_html_element_for(tagName, attrs);
                stack.pop();
                return;
            default:
                end('colgroup');
                start(tagName);
                return;
        }
    },

    insertion_mode_end: function (tagName) {
        if (typeof(tagName) === undefined) {
            return;
        }
        tagName = tagName.toLowerCase();
        switch (tagName) {
            case 'colgroup':
                if (current_node().name !== 'html') {
                    stack.pop();
                    insertion_mode = InTable;
                }
                return;
            case 'col':
                return;
            default:
                end('colgroup');
                end(tagName);
                return;
        }
    }
};

var InTableBody = {
    insertion_mode_start: function (tagName, attrs, unary) {
        tagName = tagName.toLowerCase();
        switch (tagName) {
            case 'tr':
                clear_stack_to_table_body_context();
                insert_html_element_for(tagName, attrs);
                insertion_mode = InRow;
                return;
            case 'th':
            case 'td':
                start('tr');
                start(tagName, attrs, unary);
                return;
            case "caption":
            case "col":
            case "colgroup":
            case "tbody":
            case "tfoot":
            case "thead":
                if (in_table_scope('tbody') || in_table_scope('thead') || in_table_scope('tfoot')) {
                    clear_stack_to_table_body_context();
                    end(current_node().name);
                    start(tagName, attrs, unary);
                }
                return;
        }
    },

    insertion_mode_end: function (tagName) {
        if (typeof(tagName) === undefined) {
            return;
        }
        tagName = tagName.toLowerCase();
        switch (tagName) {
            case 'tbody':
            case 'tfoot':
            case 'thead':
                if (in_table_scope(tagName)) {
                    clear_stack_to_table_body_context();
                    stack.pop();
                    insertion_mode = InTable;
                }
                return;
            case 'table':
                if (in_table_scope('tbody') || in_table_scope('thead') || in_table_scope('tfoot')) {
                    clear_stack_to_table_body_context();
                    end(current_node().name);
                    end(tagName);
                }
                return;
            case "body":
            case "caption":
            case "col":
            case "colgroup":
            case "html":
            case "td":
            case "th":
            case "tr":
                return;
            default:
                InTable.insertion_mode_end(tagName);
                return;
        }
    }
};

var InRow = {
    insertion_mode_start: function (tagName, attrs, unary) {
        tagName = tagName.toLowerCase();
        switch (tagName) {
            case 'th':
            case 'td':
                clear_stack_to_table_row_context();
                var node = insert_html_element_for(tagName, attrs);
                insertion_mode = InCell;
                active_elements.push(node);
                return;
            case "caption":
            case "col":
            case "colgroup":
            case "tbody":
            case "tfoot":
            case "thead":
            case "tr":
                end('tr');
                start(tagName, attrs, unary);
                return;
            default:
                InTable.insertion_mode_start(tagName, attrs, unary);
                return;
        }
    },

    insertion_mode_end: function (tagName) {
        if (typeof(tagName) === undefined) {
            return;
        }
        tagName = tagName.toLowerCase();
        switch (tagName) {
            case 'tr':
                if (in_table_scope(tagName)) {
                    clear_stack_to_table_row_context();
                    stack.pop();
                    insertion_mode = InTableBody;
                }
                return;
            case 'table':
                end('tr');

                // this line was in the original source but attrs/unary are not defined
                // so not sure what to do with it. how was this working?
                // start(tagName, attrs, unary);
                return;
            case "tbody":
            case "tfoot":
            case "thead":
                if (in_table_scope(tagName)) {
                    end('tr');
                    end(tagName);
                }
                return;
            case "body":
            case "caption":
            case "col":
            case "colgroup":
            case "html":
            case "td":
            case "th":
                return;
            default:
                InTable.insertion_mode_end(tagName);
                return;
        }
    }
};

var InCell = {
    insertion_mode_start: function (tagName, attrs, unary) {
        tagName = tagName.toLowerCase();
        switch (tagName) {
            case "caption":
            case "col":
            case "colgroup":
            case "tbody":
            case "td":
            case "tfoot":
            case "th":
            case "thead":
            case "tr":
                if (in_table_scope('td') || in_table_scope('th')) {
                    close_the_cell();
                    start(tagName, attrs, unary);
                }
                return;
            default:
                InBody.insertion_mode_start(tagName, attrs, unary);
                return;
        }
    },

    insertion_mode_end: function (tagName) {
        if (typeof(tagName) === undefined) {
            return;
        }
        tagName = tagName.toLowerCase();
        switch (tagName) {
            case "td":
            case "th":
                if (in_table_scope(tagName)) {
                    generate_implied_end_tags();
                    if (current_node().name !== tagName) {
                        return;
                    }
                    var node;
                    do {
                        node = stack.pop();
                    } while (node.name !== tagName);

                    clear_active_elements_to_last_marker();
                    insertion_mode = InRow;
                }
                return;
            case "body":
            case "caption":
            case "col":
            case "colgroup":
            case "html":
                return;
            case "table":
            case "tbody":
            case "tfoot":
            case "thead":
            case "tr":
                if (in_table_scope(tagName)) {
                    close_the_cell();
                    end(tagName);
                }
                return;
            default:
                InBody.insertion_mode_end(tagName);
                return;
        }
    }
};

UniHTML = {
    /**
     * Parse html string and calls callback in the same order as tags in html string are present.
     * Method supports html5, including custom tags.
     * @param html
     * @param handler {Object} object of callbacks for example:
     * {
     *          // attributesOnTag is an Object like {name, value, escaped}
     *      start: function(tagName, attributesOnTag, isSelfClosing), // open tag
     *      end: function(tagName), // close
     *      chars: function(text), // text between open and closing tag
     *      comment: function(text) // text from comment
     * }
     * @throws Parse Error
     */
    parse: HTMLParser,
    /**
     * Cleanup dirty html from unknown/untrusted tags
     * @param html {string} html string to purify
     * @param settings {Object} noFormatting, preferStrong_Em, preferB_I, noHeaders, withoutTags
     * @returns {HTML|string|void}
     */
    purify: function (html, settings) {
        if (typeof settings !== 'object') {
            settings = {};
        }
        init(settings);
        insertion_mode = InBody;

        try {
            HTMLParser(html, {
                start: start,
                end: end,
                chars: chars
            });
        } catch (e) {
            if (!settings.catchErrors) {
                throw e;
            }
        }

        return root.innerHTML().replace(/^\s+/, '');
    },
    /**
     * Sets new allowed attributes for one or all tags
     * @param attributesArray {Array} Array of names of attributes
     * @param tag {string=} [tag=all_elements]
     */
    setNewAllowedAttributes: function (attributesArray, tag) {
        if (!tag) {
            tag = 'all_elements';
        }
        if (!attributesArray) {
            attributesArray = [];
        }
        if (typeof attributesArray === 'string') {
            attributesArray = [attributesArray];
        }
        allowed_attributes[tag] = attributesArray;
    },
    /**
     * Adds new allowed html tag
     * @param tagName {string}
     * @param isSelfClosing {boolean=} a void tags like: img, hr, area
     */
    addNewAllowedTag: function (tagName, isSelfClosing) {
        customTags[tagName] = true;
        if (isSelfClosing) {
            selfClosing[tagName] = true;
        }
    },

    TextNode: TextNode,
    Node: Node
};