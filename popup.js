let contrastSwitch = document.getElementById("contrastSwitch");
// TODO: add listener for contrast switch being set to on/off

import { pSBC, getContrast, minContrast } from './contrast.mjs';

// find elements that have a bad contrast ratio according to WCAG AAA
// 7:1 for regular text
// 4.5:1 for heading or large text
let elements = document.body.getElementsByTagName("*");  // get all elements inside body
let badElements = [];

for (let i = 0; i < elements.length; i++) { //goes through all elements
    let element = elements[i];
    if (element.textContent.trim !== "") { //check that it's an element with text
        //get the element's text color and background color
        let textColor = element.style.color;
        let backgroundColor = element.style.backgroundColor;

        // calculate contrast ratio
        let contrast = getContrast(textColor, backgroundColor);

        // find the needed contrast ratio depending on type of text
        let goodContrast = minContrast(element);

        if (contrast < goodContrast) {
            badElements.push(element);  // does not meet WCAG, need to fix
        }
    }
}

// TODO: for each pair, darken the darker color until AAA standard is met and apply the change to the HTML element
    //call darken
    //when you find that color that meets the standard, then apply the chance
    //element.style.color = darker

//TODO: add something to store the original (global value)
    //original elements array that stores the original element
    //when they toggle back, reset it
    //instead of in the listener, it's outside