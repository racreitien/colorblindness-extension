let contrastSwitch = document.getElementById("contrastSwitch");
// TODO: add listener for contrast switch being set to on/off

import { pSBC, makeArrayRGB, realBackgroundColor, getContrast, minContrast, darken } from './contrast.mjs';

// find elements that have a bad contrast ratio according to WCAG AAA
// 7:1 for regular text
// 4.5:1 for heading or large text
let elements = document.body.getElementsByTagName("*");  // get all elements inside body
let badElements = [];

for (let i = 0; i < elements.length; i++) { //goes through all elements
    let element = elements[i];
    if (element.textContent.trim !== "") { //check that it's an element with text
        console.log("on element " + element.nodeName + ": " + element.textContent)
        //get the element's text color and background color
        let textColor = makeArrayRGB(getComputedStyle(element).color);
        let backgroundColor = makeArrayRGB(realBackgroundColor(element));
        console.log("text color: " + textColor + ", background color: " + backgroundColor)

        // calculate contrast ratio
        let contrast, isBright = getContrast(textColor, backgroundColor);
        console.log("contrast ratio: " + contrast)

        // find the needed contrast ratio depending on type of text
        let goodContrast = minContrast(element);
        console.log("min contrast ratio: " + goodContrast)

        if (contrast < goodContrast) {
            console.log("BAD contrast, added to badElements array")
            badElements.push(element);  // does not meet WCAG, need to fix
        }
    }
}

//adjust colors to bad elements
for (let i = 0; i < badElements.length; i++) {
    //get the element's text color and background color
    let textColor = makeArrayRGB(getComputedStyle(badElements[i]).color);
    let backgroundColor = makeArrayRGB(realBackgroundColor(badElements[i]));

    // calculate contrast ratio
    let contrast, isBright = getContrast(textColor, backgroundColor);
    let lighter = "";
    let darker = "";
    if (isBright) { //text color is brighter
        lighter = textColor;
        darker = backgroundColor;
    } else { //background color is brighter
        darker = textColor;
        lighter = backgroundColor;
    }

    //call darken to actually find the colors to correct to.
    let darker_color, lighter_color = darken(darker, lighter, badElements[i]);

    if (isBright) { 
        badElements[i].style.color = lighter_color;
        badElements[i].style.backgroundColor = darker_color;
    } else {
        badElements[i].style.color = darker_color;
        badElements[i].style.backgroundColor = lighter_color;
    }
}

//TODO: add something to store the original (global value)
    //original elements array that stores the original element
    //when they toggle back, reset it
    //instead of in the listener, it's outside