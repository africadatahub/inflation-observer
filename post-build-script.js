const fs = require('fs');
const path = require('path');
const glob = require('glob');

const randomClass = 'unique-' + Math.random().toString(36).substring(2, 8);

// Find the name of the generated CSS file
const files = glob.sync('dist/*.css');
if (files.length === 0) {
    console.error('Could not find generated CSS file');
    process.exit(1);
}
const cssFile = path.basename(files[0]);

// Read the CSS file
let css = fs.readFileSync(files[0], 'utf8');

function parseCSS(css_in) {

    let importRulesArr = [];
    let keyframesRulesArr = [];
    let mediaRulesArr = [];
    let rules = [];
    let cssWithoutImports = '';
    let cssWithoutKeyframes = '';
    let cssWithoutMedia = '';
    let cssWithoutRules = '';

    /*
    --------------------------------------------
    @import
    ---------------------------------------------
    */

    // First find the @import rules ending with );
    let importRules = css_in.match(/@import.*?\";/g);
    if (importRules) {
        importRules.forEach(function (rule) {
            importRulesArr.push(rule);
        });
    }

    // Delete the @import rules
    cssWithoutImports = css_in.replace(/@import.*?\";/g, '');

    /*
    --------------------------------------------
    @keyframes
    ---------------------------------------------
    */

    // Find the @keyframes rules ending with });
    let keyframesRules = cssWithoutImports.match(/@keyframes.*?\}\s*\}/g);

    cssWithoutKeyframes = cssWithoutImports;

    if (keyframesRules) {
        keyframesRules.forEach(function (rule) {
            keyframesRulesArr.push(rule);

            // Delete the @keyframes rules
            cssWithoutKeyframes = cssWithoutKeyframes.replace(rule, '');
        });
    }

    /*
    --------------------------------------------
    @media
    ---------------------------------------------
    */

    // Find the @media rules ending with });
    let mediaRules = cssWithoutKeyframes.match(/@media.*?\}\s*\}/g);

    cssWithoutMedia = cssWithoutKeyframes;

    if (mediaRules) {
        mediaRules.forEach(function (rule) {
            mediaRulesArr.push(rule);

            // Delete the @media rules
            cssWithoutMedia = cssWithoutMedia.replace(rule, '');
        });
    }

    mediaRulesArr.forEach(rule => {

        // If the rule contains a media query
        if (rule.includes('@media')) {

            // Get the mediaquery definition
            let mediaQuery = rule.match(/@media.*?(?=\{)/g)[0];

            // extract each child rule
            let childRules = rule.match(/(.*?)(\{.*?\})/g);

            // Delete the media query from the array
            mediaRulesArr = mediaRulesArr.filter(item => item !== rule);

            // Add each child rule to the array
            childRules.forEach((childRule, index) => {
                if (index === 0) {
                    childRule = childRule.replace('{', '').replace(mediaQuery, '');
                }

                //   add random class after each comma
                childRule = childRule.replace(/,/g, ', .' + randomClass + ' ');

                mediaRulesArr.push(mediaQuery + '{ .' + randomClass + ' ' + childRule + '}');
            });

        }

    })

    /*
    --------------------------------------------
    Normal Rules
    ---------------------------------------------
    */

    // extract the rules
    let singleRules = cssWithoutMedia.match(/(.*?)(\{.*?\})/g);

    cssWithoutRules = cssWithoutMedia;

    if (singleRules) {
        singleRules.forEach(rule => {

            if (rule.includes(':root')) {
                rule = rule.replace(':root', '.' + randomClass);
                rules.push(rule);
            }  else {

                // add random class after each comma that occurs before the first {
                rule = rule.replace(/,(?=[^}]*{)/g, ', .' + randomClass + ' ');

                rules.push('.' + randomClass + ' ' + rule);
            }

            // Delete the rules
            cssWithoutRules = cssWithoutRules.replace(rule, '');
        });
    }


    return {
        importRulesArr: importRulesArr,
        keyframesRulesArr: keyframesRulesArr,
        mediaRulesArr: mediaRulesArr,
        rules: rules
    }

}

css = css.replace(/(\r\n|\n|\r)/gm, '');

// remove all comments
css = css.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '');


let result = parseCSS(css);

let resultString = result.importRulesArr.join('\n') + '\n' + result.rules.join('\n') + result.keyframesRulesArr.join('\n') + '\n' + result.mediaRulesArr.join('\n');

resultString = resultString.replaceAll('.' + randomClass + ' body{', '.' + randomClass + ' .body{');
resultString = resultString.replaceAll('.' + randomClass + ' html{', '.' + randomClass + ' .html{');

// Let's change all rem values to px with rem multiplied by 14
// TODO: This is to fix scaling issues and should be optional 
resultString = resultString.replaceAll(/(\d*\.?\d+)rem/g, function (match, p1) {
    return (parseFloat(p1) * 14) + 'px';
});

// replace css in file with new css and join each rule with a line break
fs.writeFileSync(files[0], resultString);
console.log(`Added class '${randomClass}' to the css file`);

// Find the name of the HTML file
const htmlFiles = glob.sync('dist/*.html');
if (htmlFiles.length === 0) {
    console.error('Could not find generated HTML file');
    process.exit(1);
}

// Read the HTML file
const htmlFile = fs.readFileSync(htmlFiles[0], 'utf8');

// Add the random class to the 'app' element
// Probably don't need all the wrappers. Just add randomClass to app
const updatedHtml = htmlFile.replace('<div class="app"></div>', `<div class="${randomClass}"><div class="html"><div class="body"><div class="app"></div></div></div></div>`);

// Write the modified HTML back to the file
fs.writeFileSync(htmlFiles[0], updatedHtml);
console.log(`Added class '${randomClass}' to the 'app' element in '${htmlFiles[0]}'`);

// TODO: Rename files?
