var _ = require("./utils"),
    $Element = require("./element"),
    eventType = _.WEBKIT_PREFIX ? ["webkitAnimationEnd", "webkitTransitionEnd"] : ["animationend", "transitionend"],
    animationProps = ["transition-duration", "animation-duration", "animation-iteration-count"],
    changeVisibility = function(el, fn, callback) {
        return function() {
            el.legacy(function(node, el, index, ref) {
                var value = typeof fn === "function" ? fn(node) : fn,
                    styles = el.style(animationProps),
                    transitionDuration = parseFloat(styles[animationProps[0]]) || 0,
                    animationDuration = parseFloat(styles[animationProps[1]]) || 0,
                    iterationCount = parseFloat(styles[animationProps[2]]) || 0,
                    duration = Math.max(iterationCount * animationDuration, transitionDuration),
                    hasAnimation = _.CSS3_ANIMATIONS && duration && node.offsetWidth,
                    completeAnimation = function() {
                        // fix for quick hide/show when hiding is in progress
                        if (node.getAttribute("aria-hidden") === "true") {
                            // hide element and remove it from flow
                            node.style.visibility = "hidden";
                            node.style.position = "absolute";
                        }

                        if (hasAnimation) node.style.pointerEvents = "";

                        if (callback) callback(el, index, ref);
                    };

                if (value) {
                    // store current inline value in a private property
                    el[_.DISPLAY] = node.style.position;
                } else {
                    node.style.position = el[_.DISPLAY] || "";
                }

                // set styles inline to override inherited
                node.style.visibility = "visible";

                if (hasAnimation) {
                    // prevent accidental user actions during animation
                    node.style.pointerEvents = "none";
                    // choose max delay to determine appropriate event type
                    el.once(eventType[duration === transitionDuration ? 1 : 0], completeAnimation);
                }
                // trigger native CSS animation
                node.setAttribute("aria-hidden", value);
                // when there is no animation the completeAnimation call
                // must be AFTER changing the aria-hidden attribute
                if (!hasAnimation) el.fire(completeAnimation);
            });
        };
    },
    makeVisibilityMethod = function(name, fn) {
        return function(delay, callback) {
            var len = arguments.length,
                delayType = typeof delay;

            if (len === 1 && delayType === "function") {
                callback = delay;
                delay = 0;
            }

            if (delay && (delayType !== "number" || delay < 0) ||
                callback && typeof callback !== "function") {
                throw _.makeError(name);
            }

            callback = changeVisibility(this, fn, callback);

            if (delay) {
                setTimeout(callback, delay);
            } else {
                callback();
            }

            return this;
        };
    };

/**
 * Show element with optional callback and delay
 * @param {Number}   [delay=0]  time in miliseconds to wait
 * @param {Function} [callback] function that executes when animation is done
 * @return {$Element}
 * @function
 */
$Element.prototype.show = makeVisibilityMethod("show", false);

/**
 * Hide element with optional callback and delay
 * @param {Number}   [delay=0]  time in miliseconds to wait
 * @param {Function} [callback] function that executes when animation is done
 * @return {$Element}
 * @function
 */
$Element.prototype.hide = makeVisibilityMethod("hide", true);

/**
 * Toggle element visibility with optional callback and delay
 * @param {Number}   [delay=0]  time in miliseconds to wait
 * @param {Function} [callback] function that executes when animation is done
 * @return {$Element}
 * @function
 */
$Element.prototype.toggle = makeVisibilityMethod("toggle", function(node) {
    return node.getAttribute("aria-hidden") !== "true";
});
