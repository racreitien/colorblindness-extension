let btn = document.getElementById("contrastSwitch");

// Set our button's color to the color that we stored
chrome.storage.sync.get("color", ({color}) => {
    btn.style.backgroundColor = color
})

import { pSBC, makeArrayRGB, realBackgroundColor, getContrast, minContrast, darken } from './contrast.mjs';

// listener for contrast switch being set to on/off
btn.addEventListener("click", async () => {
    // Find current tab
    let [tab] = await chrome.tabs.query({active: true, currentWindow:true}) 
    // Run the following script on our tab
    chrome.scripting.executeScript({ 
        args: [btn.checked],
        target: {tabId: tab.id},
        func: applyColor,
    });

    function applyColor (enabled) {
        /* * * * * * * * * * DEBUG * * * * * * * * * */
        // all of contrast.mjs in this block
        // need to inject the functions somehow, maybe passed in arguments

        // take a color and darken in without changing the shade.
        // origination: https://github.com/PimpTrizkit/PJs/wiki/12.-Shade,-Blend-and-Convert-a-Web-Color-(pSBC.js)
        const pSBC = (percent, from, to, linear_blending) => {
            //from: "before" color, to: "after" color
            //percent: percentage to blend by (numerical value)
            //linear blending: boolean value for if you wish to use linear blending or not
            let r, g, b, P, f, t, hex, m = Math.round, alpha = typeof(to) == "string";
                //r, g, b: RGB colors
                //f, t: from/to values that are specified for the r, g, b colors
                //hex: used for if you're dealing with a hex value
                //m: for shortening the "Math.round" expression
                //alpha: value for the alpha channel - used in linear blending
            if (typeof(percent) != "number" || percent < -1 || percent > 1 || typeof(from) != "string" || (from[0] != 'r' && from[0] != '#') || (to && !alpha)) {
                return null;
            }
            hex = from.length > 9;
            hex = alpha ? to.length > 9 ? true : to == "c" ? !hex : false : hex;
            f = pSBC.pSBCr(from);
            P = percent < 0;
            t = to && to != "c" ? pSBC.pSBCr(to) : P ? {r:0, g:0, b:0, alpha: -1} : {r:255, g:255, b:255, alpha: -1};
            percent = P ? percent *- 1 : percent;
            P = 1 - percent;
            if (!f || !t) { //if there's no 'from' or 'to' values to work with
                return null;
            }
            if (linear_blending) {
                r = m(P * f.r + percent * t.r);
                g = m(P * f.g + percent * t.g);
                b = m(P * f.b + percent * t.b);
            } else {
                r = m((P * f.r ** 2 + percent * t.r ** 2) ** 0.5);
                g = m((P * f.g ** 2 + percent * t.g ** 2) ** 0.5);
                b = m((P * f.b ** 2 + percent * t.b ** 2) ** 0.5);
            }
            alpha = f.alpha;
            t = t.alpha;
            f = alpha >= 0 || t >= 0;
            alpha = f ? alpha < 0 ? t : t < 0 ? alpha : alpha * P + t * percent : 0;
            if (hex) {
                return "rgb(" + r + ", " + g + ", " + b + ")";
            } else {
                return "#" + (4294967296 + r * 16777216 + g * 65536 + b * 256 + (f ? m(alpha * 255) : 0)).toString(16).slice(1, f ? undefined : -2);
            }
        }

        // origination: https://github.com/PimpTrizkit/PJs/wiki/12.-Shade,-Blend-and-Convert-a-Web-Color-(pSBC.js)
        pSBC.pSBCr = (digits) => {
            //digits: what makes up the RGB value
            //r, g, b: RGB colors
            const i = parseInt; //shorthand for parseInt
            let n = digits.length, x = {};
            if (n > 9) {
                const [r, g, b, alpha] = (digits = digits.split(','));
                n = digits.length;
                if (n<3 || n>4) {
                    return null;
                }
                x.r = i(r[3] == "a" ? r.slice(5) : r.slice(4));
                x.g = i(g); 
                x.b = i(b);
                x.alpha = alpha ? parseFloat(alpha):-1;
            } else {
                if (n == 8 || n == 6 || n<4) {
                    return null;
                }
                if (n < 6) {
                    digits = "#" + digits[1] + digits[1] + digits[2] + digits[2] + digits[3] + digits[3] + (n > 4 ? digits[4] + digits[4] : "");
                }
                digits = i(digits.slice(1), 16);
                if (n == 9 || n == 5) {
                    x.r = digits >> 24&255;
                    x.g = digits >> 16&255;
                    x.b = digits >> 8&255;
                    x.alpha = Math.round((digits & 255)/0.255)/1000;
                } else {
                    x.r = digits >> 16;
                    x.g = digits >> 8&255; 
                    x.b = digits & 255; 
                    x.alpha = -1;
                }
            } return x
        };

        // gets the background color of a DOM element
        // origination: https://stackoverflow.com/questions/12576084/getting-the-real-background-color-of-an-element
        function realBackgroundColor(elem) {
            var transparent = 'rgba(0, 0, 0, 0)';
            var transparentIE11 = 'transparent';
            if (!elem) return transparent;

            var bg = getComputedStyle(elem).backgroundColor;
            if (bg === transparent || bg === transparentIE11) {
                return realBackgroundColor(elem.parentElement);
            } else {
                return bg;
            }
        }

        // turns an rgb string in format rgb(0, 0, 0) to an array [0, 0, 0]
        function makeArrayRGB(rgb) {
            let colorArr = rgb.slice(
                rgb.indexOf("(") + 1, 
                rgb.indexOf(")")
            ).split(", ");
            
            return colorArr;
        }  

        // calculates the contrast of two colors
        // origination: https://github.com/LeaVerou/contrast-ratio/tree/d402291022c882c9ae5547b755afa9976460374c
        function luminance(r, g, b) {
            //r, g, b: RGB colors
            var a = [r, g, b].map(function (v) {         
                v /= 255;
                return v <= 0.03928
                    ? v / 12.92
                    : Math.pow( (v + 0.055) / 1.055, 2.4 );
            });
            return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
        }

        // origination: https://github.com/LeaVerou/contrast-ratio/tree/d402291022c882c9ae5547b755afa9976460374c
        // calculate beginnning contrast
        function getContrast(rgb1, rgb2) {
            var lum1 = luminance(rgb1[0], rgb1[1], rgb1[2]);
            var lum2 = luminance(rgb2[0], rgb2[1], rgb2[2]);
            var brightest = Math.max(lum1, lum2);
            var darkest = Math.min(lum1, lum2);
            var isBright = false;
            if (lum1 == brightest) {
                isBright = true;
            }
            return [(brightest + 0.05) / (darkest + 0.05), isBright];
        }

        // returns the minimum contrast ratio that satisfies WCAG AAA according to type of text
        function minContrast(element) {
            // define large text --> at least 18 pt regular font or 14 pt bold font
            let fontWeight = getComputedStyle(element).fontWeight;
            let largeFont = (Number(fontWeight) > 400 || fontWeight === "bold") ? 14 : 18;

            if (element.nodeName.startsWith("H") || element.style.fontSize >= largeFont) {
                return 4.5;
            }
            
            return 7;  // normal text
        }

        // TODO: add function that darkens a color to meet a certain ratio against a second color
        // getContrast():   [#,#,#] input
        // pSBC():          rgb(#,#,#) input
        function darken(darker, lighter, element) { //pass in element instead of contrast?
            //call pSBC here until you reach the getContrast parameter in a while loop
            while (getContrast(darker, lighter)[0] < minContrast(element)){
                let light = 'rgb('+lighter[0]+','+lighter[1]+','+lighter[2]+')';
                let dark = 'rgb('+darker[0]+','+darker[1]+','+darker[2]+')';
                lighter = makeArrayRGB(pSBC (0.25, light)); // 25% Lighter
                darker = makeArrayRGB(pSBC (-0.25, dark)); // 25% Darker
                // alert(getContrast(darker, lighter)[0]);
                // lighter, darker: rgb(#,#,#)
            }
            lighter = 'rgb('+lighter[0]+','+lighter[1]+','+lighter[2]+')';
            darker = 'rgb('+darker[0]+','+darker[1]+','+darker[2]+')';
            return [darker, lighter];
        }
        /* * * * * * * * * END DEBUG * * * * * * * * */
        










        
        // find elements that have a bad contrast ratio according to WCAG AAA
        // 7:1 for regular text
        // 4.5:1 for heading or large text
        if (enabled) {
            let elements = document.body.getElementsByTagName("*");  // get all elements inside body
            let badElements = [];
            for (let i = 0; i < elements.length; i++) { //goes through all elements
                let element = elements[i];
                try {
                    if (element.textContent.trim !== "") { //check that it's an element with text
                        console.log("on element " + element.nodeName + ": " + element.textContent)
                        //get the element's text color and background color
                        let textColor = makeArrayRGB(getComputedStyle(element).color);
                        let backgroundColor = makeArrayRGB(realBackgroundColor(element));
                        console.log("text color: " + textColor + ", background color: " + backgroundColor)

                        // calculate contrast ratio
                        let contrast = getContrast(textColor, backgroundColor)[0];
                        let isBright = getContrast(textColor, backgroundColor)[1];
                        console.log("contrast ratio: " + contrast)

                        // find the needed contrast ratio depending on type of text
                        let goodContrast = minContrast(element);
                        console.log("min contrast ratio: " + goodContrast)

                        if (contrast < goodContrast) {
                            console.log("BAD contrast, added to badElements array")
                            badElements.push(element);  // does not meet WCAG, need to fix
                        }
                    }
                } catch (error) {
                    console.error(error);
                }
            }
            
            //adjust colors to bad elements
            for (let i = 0; i < badElements.length; i++) {
                //get the element's text color and background color
                let textColor = makeArrayRGB(getComputedStyle(badElements[i]).color);
                let backgroundColor = makeArrayRGB(window.getComputedStyle(document.body, null).getPropertyValue('background-color'));
                // calculate contrast ratio
                let contrast = getContrast(textColor, backgroundColor)[0];
                let isBright = getContrast(textColor, backgroundColor)[1];
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
                let new_colors = darken(darker, lighter, badElements[i]);
                let darker_color = new_colors[0];
                let lighter_color = new_colors[1];
                if (isBright) { 
                    badElements[i].style.color = lighter_color;
                    document.body.style.backgroundColor = darker_color;
                } else {
                    badElements[i].style.color = darker_color;
                    document.body.style.backgroundColor = lighter_color;
                }
            }
        } else {
            window.location.reload();
        }
    }
})