// TODO: add listener for contrast switch being set to on/off

import { pSBC, getContrast } from './contrast.mjs';

// TODO: for each pair, darken the darker color until AAA standard is met
//       and apply the change to the HTML element

// Snag our button
let btn = document.getElementById("contrastSwitch")

// Set our button's color to the color that we stored
chrome.storage.sync.get("color", ({color}) => {
    btn.style.backgroundColor = color
})

// Run on click
btn.addEventListener("click", async () => {
	let [tab] = await chrome.tabs.query({active: true, currentWindow:true}) // Find current tab

	chrome.scripting.executeScript({ // Run the following script on our tab
		target: {tabId: tab.id},
		function: () => {

            // find elements that have a bad contrast ratio according to WCAG AAA
            // 7:1 for regular text
            // 4.5:1 for heading or large text
            let elements = document.body.getElementsByTagName("*");  // get all elements inside body
            let badElements = [];
            for (var i = 0; i < elements.length; i++) {
                let element = elements[i];
                // test to change text color and background
                /* * * * * * * * * * * * * * * * * * * * */
                element.style.color = "Red";
                document.body.style.backgroundColor="green"
                /* * * * * * * * * * * * * * * * * * * * */

                if (element.textContent.trim !== "") {
                    let textColor = element.style.color;
                    let backgroundColor = element.style.backgroundColor;
            
                    // calculate contrast ratio
                    // let contrast = getContrast(textColor, backgroundColor);
            
                    // // find the needed contrast ratio depending on type of text
                    // let goodContrast = NaN;
            
                    // // define large text --> at least 18 pt regular font or 14 pt bold font
                    // let fontWeight = getComputedStyle(element).fontWeight;
                    // let largeFont = (Number(fontWeight) > 400 || fontWeight === "bold") ? 14 : 18;
            
                    // if (element.nodeName.startsWith("H") || element.style.fontSize >= largeFont) {
                    //     goodContrast = 4.5;
                    // }
                    // else {
                    //     goodContrast = 7;
                    // }
            
                    // if (contrast < goodContrast) {
                    //     badElements.push(element);  // does not meet WCAG, need to fix
                    // }
                }
            }



		}
	})
})