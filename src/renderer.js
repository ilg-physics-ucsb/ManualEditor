let simpleMDE = require('simplemde')

let regeneratorRuntime = require('regenerator-runtime')

const { dialog } = require('electron').remote
const settings = require('electron').remote.require('electron-settings')

const path = require('path')
const fs = require('fs')

let unified = require('unified')
let markdown = require('remark-parse')
let remark2rehype = require('remark-rehype')
let doc = require('rehype-document')
let format = require('rehype-format')
let html = require('rehype-stringify')
let fencedDivs = require('remark-fenced-divs')
let math = require('remark-math')
let katex = require('rehype-katex')
let manualEnv = require("./manaulEnv")
let makeAbsolute = require("./makeAbsolutePath")
let firgureWrapper = require("./figureWrapper")
let mathJax = require('rehype-mathjax')
let report = require('vfile-reporter')
let remarkIframe = require('remark-iframes')

var processor = makeProcessor()

function makeProcessor() {
    var processor = unified()
        .use(markdown)
        .use(math)
        .use(fencedDivs)
        .use(remarkIframe, {
            "phet.colorado.edu": {
                tag: "iframe",
                width: "100%",
                height: 600,
                disabled: false
            },
            'www.youtube.com':{
                tag: 'iframe',
                width: "100%",
                height: 600,
                disabled: false,
                replace: [
                    ['watch?v=', 'embed/'],
                    ['http://', 'https://'],
                ],
            },
            "drive.google.com":{
                tag: 'iframe',
                width: "100%",
                height: 600,
                disabled: false,
                replace : [
                    ["/view?usp=sharing", ""],
                    ["open?id=", "/file/d/"]
                ],
                append: "/preview"
            }
        })
        .use(remark2rehype)
        .use(manualEnv, {trackerList: ["Exercise", "Question"]})
        .use(firgureWrapper, {trackerList: ["Table", "Figure", "Simulation"]})
        .use(makeAbsolute, {rootDir: settings.get("filePath.lastDir")})
        .use(katex)
        .use(html);
    return processor
}


function makeHtml(text) {
    manualEnv.reset()
    firgureWrapper.reset()
    return processor.processSync(text);
}

function saveAs(editor) {
    let defaultPath = settings.get("filePath.lastDir")
    if (settings.has("filePaths.lastFile")) {
        defaultPath = path.join(defaultPath, settings.get("filePath.lastFile"))
    }

    let filePath = dialog.showSaveDialogSync({
        title: "Save Markdown File",
        defaultPath: defaultPath,
        filters: [
            {name: "Markdown", extensions: ["md"]}
        ],
        properties:["createDirectory"]
    })

    if (filePath) {
        shortSave(editor, filePath)
    }
}

function save(editor) {
    if (settings.get("saved")) {
        let filePath = path.join(settings.get("filePath.lastDir"), settings.get("filePath.lastFile"))
        shortSave(editor, filePath)
        settings.set("filePath.lastFile", path.basename(filePath))
        settings.set("filePath.lastDir", path.dirname(filePath))
        processor = makeProcessor()
    } else {
        saveAs(editor)
    }   
}

function shortSave(editor, filePath) {
    fs.writeFileSync(filePath, editor.value(), "utf8")
    settings.set("saved", true)
}

function newFile(editor) {
    let defaultPath = settings.get("filePath.lastDir")
    let dir = dialog.showOpenDialogSync({
        title: "Choose Folder To Create New Lab",
        buttonLabel: "Create New Lab",
        defaultPath: defaultPath,
        properties: ["openDirectory", "createDirectory"]
    })
    if (dir) {
        dir = dir[0]

        fs.access(path.join(dir, ".init"), fs.F_OK, (err) => {
            if (err) {
                //Folder has not been initialized with .init
                fs.mkdirSync(path.join(dir, "css"))
                fs.mkdirSync(path.join(dir, "imgs"))
                //Touch file creates .init
                fs.closeSync(fs.openSync(path.join(dir, ".init"), "w"))

                //Save Default File to css folder if they have a default set
                if (settings.get("defaultCSS.set")) {
                    fs.writeFileSync(path.join(dir, "css", settings.get("defaultCSS.name")), settings.get("defaulCSS.file"), "utf8")
                //If there is no default set see if they want to make one
                } else {
                    let createDefault = dialog.showMessageBoxSync({
                        title: "Create Default CSS?",
                        type: "question",
                        buttons: ["Yes", "No"],
                        message: "Would you like to set a file as your default CSS file? \r\n \
                        It will automatically be put into your css folder. "
                    })
                    //Create a default if they responded Yes. Ask them for a file. Suggested to be CSS doesn't have to be.
                    if (createDefault === 0) {
                        let defaultPath = settings.get("filePaths.lastDir")
                        let filePaths = dialog.showOpenDialogSync({
                            title: "Set Default CSS",
                            defaultPath: defaultPath,
                            buttonLabel: "Set Default",
                            filters: [
                                {name: "CSS", extensions:["css"]},
                                {name: "All Files", extensions:["*"]}
                            ],
                            properties: ["openFile"]
                        })

                        if (filePaths) {
                            let filePath = filePaths[0]
                            let fileName = path.basename(filePath)
                            let file = fs.readFileSync(filePath, "utf8")
                            settings.set("defaultCSS.set", true)
                            settings.set("defaultCSS.name", fileName)
                            settings.set("defaultCSS.file", file)
                        }
                    //If they don't want a CSS file then just put in a basic styles.css
                    } else {
                        fs.writeFileSync(path.join(dir, "css", "styles.css"), "")
                    }
                }
                //Clear editor
                editor.value("")
                //Change saved setting to false since this is a new file
                settings.set("saved", false)
                settings.set("filePath.lastDir", dir)
                processor = makeProcessor()
                return
            }
            dialog.showErrorBox("Lab Already Made", "This folder has been setup for a lab. \r\n Aborting.")
            return
        })
    }
}

function exportHtml(editor) {
    let lastDir = settings.get("filePath.lastDir")
    let fileName = settings.get("filePath.lastFile")
    fileName = path.basename(fileName, path.extname(fileName)) + ".html"
    let defaultPath = path.join("lastDir", fileName)
    let savePath = dialog.showSaveDialogSync({
        title: "Select Save Location",
        defaultPath: defaultPath,
        filters: [
            {name:"Html", extensions:[".html"]}
        ],
        properties:["createDirectory"]
    })

    if (savePath) {
        let finalProcessor = unified()
        .use(markdown)
        .use(math)
        .use(fencedDivs)
        .use(remarkIframe, {
            "phet.colorado.edu": {
                tag: "iframe",
                width: "100%",
                height: 600,
                disabled: false
            },
            'www.youtube.com':{
                tag: 'iframe',
                width: "100%",
                height: 600,
                disabled: false,
                replace: [
                    ['watch?v=', 'embed/'],
                    ['http://', 'https://'],
                ],
            },
            "drive.google.com":{
                tag: 'iframe',
                width: "100%",
                height: 600,
                disabled: false,
                replace : [
                    ["/view?usp=sharing", ""],
                    ["open?id=", "/file/d/"]
                ],
                append: "/preview"
            }
        })
        .use(remark2rehype)
        .use(manualEnv, {trackerList: ["Exercise", "Question"]})
        .use(firgureWrapper, {trackerList: ["Table", "Figure", "Simulation"]})
        .use(makeAbsolute, {rootDir: settings.get("filePath.lastDir")})
        .use(katex)
        .use(doc)
        .use(html);

        manualEnv.reset()
        firgureWrapper.reset()
        let htmlString = finalProcessor.processSync(editor.value())
        fs.writeFileSync(savePath, htmlString, "utf8")
    }
}

function open(editor) {
    let defaultPath = settings.get("filePath.lastDir")
    let filePaths = dialog.showOpenDialogSync({
        title: "Open Markdown File",
        defaultPath: defaultPath,
        filters: [
            {name: "Markdown", extensions: ['md']},
            {name: "All Files", extensions: ["*"]}
        ]
    })
    if (filePaths) {
        let filePath = filePaths[0]
        settings.set("filePath.lastFile", path.basename(filePath))
        settings.set("filePath.lastDir", path.dirname(filePath))
        processor = makeProcessor()
        var file = fs.readFileSync(filePath, "utf8")
        editor.value(file)
    }
}

var customToolbar = [{
        name: "new",
        action: newFile,
        className: "fa fa-plus-square",
        title: "New File"
    },
    {
        name: "open",
        action: open,
        className: "fa fa-folder-open",
        title: "Open"
    },
    {
        name: "save",
        action: save,
        className: "fa fa-save",
        title: "Save"
    },
    {   
        name: "export",
        action: exportHtml,
        className: "fa fa-html5",
        title: "Export"
    },
    "|",
    {
        name: "side-by-side",
        action: simpleMDE.toggleSideBySide,
        className: "fa fa-columns no-disable no-mobile",
        title: "Side By Side"
    },
    {
        name: "preview",
        action: simpleMDE.togglePreview,
        className: "fa fa-eye no-disable",
        title: "Preview"
    },
    "|",
    {
        name: "bold",
        action: simpleMDE.toggleBold,
        className: "fa fa-bold",
        title: "Bold"
    },
    {
        name: "italic",
        action: simpleMDE.toggleItalic,
        className: "fa fa-italic",
        title: "Italic"
    },
    {
        name: "strikethrough",
        action: simpleMDE.toggleStrikethrough,
        className: "fa fa-strikethrough",
        title: "Strikethrough"
    },
    "|",
    {
        name: "heading-1",
        action: simpleMDE.toggleHeading1,
        className: "fa fa-header fa-header-x fa-header-1",
        title: "Heading 1"
    },
    {
        name: "heading-2",
        action: simpleMDE.toggleHeading2,
        className: "fa fa-header fa-header-x fa-header-2",
        title: "Heading 2"
    },
    {
        name: "heading-3",
        action: simpleMDE.toggleHeading3,
        className: "fa fa-header fa-header-x fa-header-3",
        title: "Heading 3"
    },
    "|",
    {
        name: "code",
        action: simpleMDE.toggleCodeBlock,
        className: "fa fa-code",
        title: "Code Block"
    },
    {
        name: "quote",
        action: simpleMDE.toggleBlockquote,
        className: "fa fa-quote-left",
        title: "Block Quote"
    },
    "|",
    {
        name: "unordered-list",
        action: simpleMDE.toggleUnorderedList,
        className: "fa fa-list-ul",
        title: "Bulleted List"
    },
    {
        name: "ordered-list",
        action: simpleMDE.toggleOrderedList,
        className: "fa fa-list-ol",
        title: "Numbered List"
    },
    "|",
    {
        name: "link",
        action: simpleMDE.drawLink,
        className: "fa fa-link",
        title: "Link"
    },
    {
        name: "image",
        action: simpleMDE.drawImage,
        className: "fa fa-picture-o",
        title: "Image"
    },
    {
        name: "table",
        action: simpleMDE.drawTable,
        className: "fa fa-table",
        title: "Table"
    },
    {
        name: "horizontal-rule",
        action: simpleMDE.drawHorizontalRule,
        className: "fa fa-minus",
        title: ""
    },
    "|",
    {
        name: "fullscreen",
        action: simpleMDE.toggleFullScreen,
        className: "fa fa-arrows-alt no-disable no-mobile",
        title: ""
    },
]

window.addEventListener('DOMContentLoaded', function(event) {
    let textArea = document.getElementById("markdown-editor")
    let simplemde = new simpleMDE({
        element: textArea,
        autosave: {
            enabled: true,
            uniqueId: "UCSBPhysics_"
        },
        previewRender: makeHtml,
        showIcons: [
            "bold", "italic", 'strikethrough',
            "heading-1", "heading-2", "heading-3",
            "code", "quote", "unordered-list", "ordered-list",
            'link', 'image', 'table',
            'horizontal-rule', 'preview', 'side-by-side', 'fullscreen',
        ],
        toolbar: customToolbar
    });
    console.log(simpleMDE)
})
