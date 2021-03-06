let btn = document.getElementById("contrastSwitch");

// Set our button's color to the color that we stored
chrome.storage.sync.get("color", ({color}) => {
    btn.style.backgroundColor = color
})

// import { pSBC, makeArrayRGB, realBackgroundColor, getContrast, minContrast, darken } from './contrast.mjs';

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
            let r, g, b, per, f, t, hex, alpha = typeof(to) == "string";
                //r, g, b: RGB colors
                //per: boolean to determine if your percentage is negative
                //f, t: from/to values that are specified for the r, g, b colors
                //hex: used for if you're dealing with a hex value
                //alpha: value for the alpha channel - used in linear blending
            if (typeof(percent) != "number" || percent < -1 || percent > 1 || typeof(from) != "string" || (from[0] != 'r' && from[0] != '#') || (to && !alpha)) {
                return null;
            }
            hex = from.length > 9;
            hex = alpha ? to.length > 9 ? true : to == "c" ? !hex : false : hex;
            f = pSBC.pSBCr(from);
            per = percent < 0; //boolean
            t = to && to != "c" ? pSBC.pSBCr(to) : per ? {r:0, g:0, b:0, alpha: -1} : {r:255, g:255, b:255, alpha: -1};
            percent = per ? percent *- 1 : percent; //if your percentage is negative, make it positive.
            per = 1 - percent; //opposite of percentage
            if (!f || !t) { //if there's no 'from' or 'to' values to work with
                return null;
            }
            if (linear_blending) {
                r = Math.round(per * f.r + percent * t.r);
                g = Math.round(per * f.g + percent * t.g);
                b = Math.round(per * f.b + percent * t.b);
            } else {
                r = Math.round((per * f.r ** 2 + percent * t.r ** 2) ** 0.5);
                g = Math.round((per * f.g ** 2 + percent * t.g ** 2) ** 0.5);
                b = Math.round((per * f.b ** 2 + percent * t.b ** 2) ** 0.5);
            }
            alpha = f.alpha; //from's alpha value
            t = t.alpha; //to's alpha value
            f = alpha >= 0 || t >= 0; //f is a boolean to determine if you have an alpha value, whether in a or in t.alpha
            alpha = f ? alpha < 0 ? t : t < 0 ? alpha : alpha * per + t * percent : 0;
            if (hex) { //hex to rgb conversion
                let open_par = "";
                let new_alpha = "";
                if (f) {
                    open_par = "a("; //if you've got an alpha value, include that in your string
                    new_alpha = "," + Math.round(alpha * 1000)/1000; //re-calculate new alpha value
                } else {
                    open_par = "("; //no alpha value to start with
                    new_alpha = ""; //no alpha value to add in.
                }
                return "rgb" + open_par + r + "," + g + "," + b + new_alpha + ")";
            } else { //rgb to hex conversion
                let new_alpha = 0;
                let rgb_to_hex_formula = 4294967296 + r * 16777216 + g * 65536 + b * 256;
                if (f) {
                    new_alpha = Math.round(alpha * 255); //alpha value to put in, if you have an alpha.
                } 
                return "#" + (rgb_to_hex_formula + new_alpha).toString(16).slice(1, f ? undefined : -2);
            }
        }

        // origination: https://github.com/PimpTrizkit/PJs/wiki/12.-Shade,-Blend-and-Convert-a-Web-Color-(pSBC.js)
        pSBC.pSBCr = (digits) => {
            //digits: what makes up the RGB value
            //r, g, b: RGB colors
            let n = digits.length, x = {};
            if (n > 9) {
                const [r, g, b, alpha] = (digits = digits.split(','));
                n = digits.length;
                if (n < 3 || n > 4) { //digit length of 3
                    return null;
                }
                x.r = parseInt(r[3] == "a" ? r.slice(5) : r.slice(4));
                x.g = parseInt(g); 
                x.b = parseInt(b);
                x.alpha = alpha ? parseFloat(alpha) : -1;
            } else {
                if (n == 8 || n == 6 || n < 4) {
                    return null;
                }
                if (n < 6) {
                    digits = "#" + digits[1] + digits[1] + digits[2] + digits[2] + digits[3] + digits[3] + (n > 4 ? digits[4] + digits[4] : "");
                }
                digits = parseInt(digits.slice(1), 16);
                if (n == 9 || n == 5) {
                    x.r = digits >> 24 & 255;
                    x.g = digits >> 16 & 255;
                    x.b = digits >> 8 & 255;
                    x.alpha = Math.round((digits & 255)/0.255)/1000;
                } else {
                    x.r = digits >> 16;
                    x.g = digits >> 8 & 255; 
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
        // relative luminance formula from W3: https://www.w3.org/TR/2008/REC-WCAG20-20081211/#relativeluminancedef
        function luminance(r, g, b) {
            //r, g, b: RGB colors
            var a = [r, g, b].map(function (v) {         
                v /= 255;
                return v <= 0.03928 //relative luminance formula calculation
                    ? v / 12.92
                    : Math.pow( (v + 0.055) / 1.055, 2.4 );
            });
            return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722; //calculating the luminance ratio
        }

        // origination: https://github.com/LeaVerou/contrast-ratio/tree/d402291022c882c9ae5547b755afa9976460374c
        // calculate beginning contrast
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

        // darkens a color to meet a certain ratio against a second color
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