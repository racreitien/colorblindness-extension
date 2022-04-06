let contrastSwitch = document.getElementById("contrastSwitch");

import { pSBC, contrast } from './contrast.mjs';

// find elements that have a bad contrast ratio according to WCAG AAA
// 7:1 for regular text
// 4.5:1 for heading or large text
let elements = document.body.getElementsByTagName("*");  // get all elements inside body
let badElements = [];

for (let i = 0; i < elements.length; i++) {
    let element = elements[i];
    if (element.textContent.trim !== "") {
        let textColor = element.style.color;
        let backgroundColor = element.style.backgroundColor;

        // calculate contrast ratio
        let contrast = contrast(textColor, backgroundColor);

        // find the needed contrast ratio depending on type of text
        let goodContrast = NaN;

        // define large text --> at least 18 pt regular font or 14 pt bold font
        let fontWeight = getComputedStyle(element).fontWeight;
        let largeFont = (Number(fontWeight) > 400 || fontWeight === "bold") ? 14 : 18;

        if (element.nodeName.startsWith("H") || element.style.fontSize >= largeFont) {
            goodContrast = 4.5;
        }
        else {
            goodContrast = 7;
        }

        if (contrast < goodContrast) {
            badElements.push(element);  // does not meet WCAG, need to fix
        }
    }
}

// TODO: for each pair, darken the darker color until AAA standard is met
//       and apply the change to the HTML element
