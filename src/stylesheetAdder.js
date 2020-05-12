var visit = require('unist-util-visit')
var is = require('hast-util-is-element')
var path = require("path")
var fs = require("fs-extra")

module.exports = attacher

function attacher(options){
    let rootDir = options.rootDir
    let relative = options.relative
    // var tempFolder = path.join(rootDir, "css", "temp")
    if (relative){
        var href = "css"
    } else {
        var href = path.join(rootDir, "css")
    }
    // var files = fs.readdirSync(tempFolder)
    var files = fs.readdirSync( path.join(rootDir, "css") )
    var cssFiles = []
    files.forEach(file => {
        if (path.extname(file) === ".css") {
            let cssFilePath = path.join(href, file)
            cssFiles.push(cssFilePath)
        }
    })

    return transformer

    function transformer(tree, file){
        visit(tree, (node) => is(node, "body"), visitor)

        let scriptNodes = []
        
        function visitor(node) {
            cssFiles.forEach(cssFile => {
                let styleNode = {
                    type: "element",
                    tagName: "link",
                    properties: {
                        rel:"stylesheet",
                        href: cssFile
                    }
                }
                node.children.unshift(styleNode)
            })
        }
    }
}