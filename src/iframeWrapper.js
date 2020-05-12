var visit = require('unist-util-visit-parents')
var is = require('hast-util-is-element')
var path = require("path")

module.exports = attacher

function attacher(options){
    return transformer

    function transformer(tree, file){
        visit(tree, node => is(node, "html"), visitor)

        function visitor(node, ancestor) {

            let iframeNode = {
                type: "element",
                tagName: "iframe",
                properties: [],
                children: [] 
            }
            let root = ancestor[0]
            iframeNode.children.push(node)
            root.children = [iframeNode]
        }
    }
}