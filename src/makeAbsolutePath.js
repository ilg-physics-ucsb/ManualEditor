var visit = require('unist-util-visit')
var is = require('hast-util-is-element')
var path = require("path")

module.exports = attacher

function attacher(options){
    let rootDir = options.rootDir
    return transformer

    function transformer(tree, file){
        visit(tree, (node) => is(node, "img"), visitor)

        function visitor(node) {
            let src = node.properties.src
            if ((!src.startsWith("http://")) && (!src.startsWith("https://")) ){
                node.properties.src = path.join(rootDir, src)
            }
        }
    }
}