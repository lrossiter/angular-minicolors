'format cjs';
'use strict';

(function(root, factory)
{
    if(typeof define === 'function' && define.amd)
    {
        define(['angular', 'jquery-minicolors'], factory);
    }
    else if(typeof exports === 'object')
    {
        module.exports = factory(require('angular'), require('jquery-minicolors'));
        module.exports = 'minicolors';
    }
    else
    {
        root.angularMinicolors = factory(root.angular, root.jqueryMinicolors);
    }
})(this, function(angular)
{

    angular.module('minicolors', []);

    angular.module('minicolors').provider('minicolors', function()
    {
        this.defaults = {
            theme: 'bootstrap',
            position: 'top left',
            defaultValue: '',
            animationSpeed: 50,
            animationEasing: 'swing',
            change: null,
            changeDelay: 0,
            control: 'hue',
            format: 'hex',
            hide: null,
            hideSpeed: 100,
            inline: false,
            letterCase: 'lowercase',
            opacity: false,
            show: null,
            showRGB: false,
            showSpeed: 100
        };

        this.$get = function()
        {
            return this;
        };

    });

    angular.module('minicolors').directive('minicolors', [
        'minicolors', '$timeout', function(minicolors, $timeout)
        {
            return {
                require: '?ngModel',
                restrict: 'A',
                scope: {minicolors: '='},
                priority: 1, //since we bind on an input element, we have to set a higher priority than angular-default input
                template: '<div class="minicolors-slider minicolors-sidepanel">' +
                '<label for="{{idPrefix}}-red">Red:<input id="{{idPrefix}}-red" class="minicolors-sidepanel-color" type="number" min="0" max="255" ng-model="red"/></label>' +
                '<label for="{{idPrefix}}-green">Green:<input id="{{idPrefix}}-green" class="minicolors-sidepanel-color" type="number" min="0" max="255" ng-model="green"/></label>' +
                '<label for="{{idPrefix}}-blue">Blue:<input id="{{idPrefix}}-blue" class="minicolors-sidepanel-color" type="number" min="0" max="255" ng-model="blue"/></label>' +
                '<label for="{{idPrefix}}-opacity">Opacity:<input id="{{idPrefix}}-opacity" autocomplete="disabled" class="minicolors-sidepanel-color" type="number" min="0" max="1" step="0.01" ng-model="opacity"/></label></div>',
                link: function(scope, element, attrs, ngModel)
                {
                    scope.idPrefix = element.attr('id') || Math.random().toString(36).substring(2, 15);
                    var inititalized = false;

                    //gets the settings object
                    var getSettings = function()
                    {
                        var config = angular.extend({}, minicolors.defaults, scope.minicolors);
                        return config;
                    };

                    /**
                     * check if value is valid color value
                     * e.g.#fff000 or #fff
                     * @param color
                     */
                    function isValidColor(color)
                    {
                        return isRgb(color) || isHex(color);
                    }

                    function isHex(color)
                    {
                        return /^#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
                    }

                    // Checks if a string is a valid RGB(A) string
                    function isRgb(string)
                    {
                        var rgb = string && string.match && string.match(
                            /^rgba?[\s+]?\([\s+]*(\d+)[\s+]*,[\s+]*(\d+)[\s+]*,[\s+]*(\d+)[\s+]*(?:,[\s]*([\d\.]+)[\s]*)?\)[\s]*$/i);
                        return (rgb && (rgb.length === 4 || rgb.length === 5)) ? true : false;
                    }

                    // Converts an RGB string to a hex string
                    function rgbString2hex(rgb)
                    {
                        rgb = rgb.match(/^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i);
                        return (rgb && rgb.length === 4) ? '#' +
                            ('0' + parseInt(rgb[1], 10).toString(16)).slice(-2) +
                            ('0' + parseInt(rgb[2], 10).toString(16)).slice(-2) +
                            ('0' + parseInt(rgb[3], 10).toString(16)).slice(-2) : '';
                    }

                    // Parses a object and returns a valid hex + opacity
                    function rgb2hex(rgb)
                    {
                        rgb.r = keepWithin(parseInt(rgb.r, 10), 0, 255);
                        rgb.g = keepWithin(parseInt(rgb.g, 10), 0, 255);
                        rgb.b = keepWithin(parseInt(rgb.b, 10), 0, 255);
                        if(rgb.a)
                        {
                            rgb.a = keepWithin(parseFloat(rgb.a, 10), 0, 1);
                        }

                        if(!rgb)
                        {
                            return null;
                        }

                        if(typeof rgb.a !== 'undefined' && rgb.a !== null)
                        {
                            return {
                                color: '#' + ('0' + rgb.r.toString(16)).slice(-2) + ('0' + rgb.g.toString(16)).slice(-2) + ('0' + rgb.b.toString(
                                    16)).slice(-2),
                                opacity: rgb.a
                            };
                        }
                        else
                        {
                            return '#' + ('0' + rgb.r.toString(16)).slice(-2) + ('0' + rgb.g.toString(16)).slice(-2) + ('0' + rgb.b.toString(
                                16)).slice(-2);
                        }
                    }

                    // Keeps value within min and max
                    function keepWithin(value, min, max)
                    {
                        if(value < min)
                        {
                            value = min;
                        }
                        if(value > max)
                        {
                            value = max;
                        }
                        return value;
                    }

                    function canSetValue()
                    {
                        return (element.data('minicolors-settings') != null);
                    }

                    /**
                     * set color value as minicolors internal color value
                     * @param color
                     */
                    function setMinicolorsValue(color)
                    {
                        if(isValidColor(color) && canSetValue())
                        {
                            element.minicolors('value', color);
                        }
                    }

                    //what to do if the value changed
                    ngModel.$render = function()
                    {


                        //we are in digest or apply, and therefore call a timeout function
                        $timeout(function()
                        {
                            var color = ngModel.$viewValue;
                            setMinicolorsValue(color);
                            element.blur();
                        }, 0, false);
                    };

                    ngModel.$parsers.push(function(value)
                    {
                        var settings = getSettings();
                        var format = (settings.modelFormat && settings.modelFormat.toLowerCase()) || settings.format.toLowerCase();

                        if(format !== settings.format.toLowerCase())
                        {
                            if(format === 'rgba')
                            {
                                return element.minicolors('rgbaString');
                            }
                            else if(format === 'rgb')
                            {
                                return element.minicolors('rgbString');
                            }
                            else if(format === 'hex' && isRgb(value))
                            {
                                return rgbString2hex(value);
                            }
                        }

                        return value;
                    });

                    var colorWatch;

                    //init method
                    var initMinicolors = function()
                    {

                        if(!ngModel)
                        {
                            return;
                        }
                        var settings = getSettings();
                        settings.change = function(hex)
                        {
                            scope.$apply(function()
                            {
                                if(isValidColor(hex))
                                {
                                    ngModel.$setViewValue(hex);
                                }
                                var rgb = element.minicolors('rgbObject');
                                scope.red = rgb.r;
                                scope.green = rgb.g;
                                scope.blue = rgb.b;
                                scope.opacity = rgb.a;
                            });
                        };

                        colorWatch = scope.$watch(
                            function()
                            {
                                return {
                                    r: scope.red,
                                    g: scope.green,
                                    b: scope.blue,
                                    a: scope.opacity
                                };
                            },
                            function(newVal, oldVal)
                            {
                                if(document.activeElement.classList.contains('minicolors-sidepanel-color'))
                                {
                                    if(oldVal && oldVal.r >= 0 && newVal && newVal.r >= 0 && newVal.g >= 0 && newVal.b >= 0)
                                    {
                                        element.minicolors('value', rgb2hex(newVal));
                                    }
                                }
                            },
                            true
                        );

                        var eventsBound = false;
                        settings.show = function()
                        {
                            var panel = $(this).siblings('div.minicolors-panel.minicolors-slider-hue');
                            var sidePanel = $(this).children();

                            if(settings.showRGB)
                            {
                                // bind events to side panel controls
                                sidePanel.appendTo(panel)
                                .on('mousedown.minicolors touchstart.minicolors', function(event)
                                {
                                    event.stopPropagation();
                                })
                                .on('blur', 'label:last-child input', hideIfFocusLeft);

                                // bind events to the actual input element
                                if(!eventsBound)
                                {
                                    $(this)
                                    .on('keydown.minicolors', function(event)
                                    {
                                        var input = $(this);
                                        if(!input.data('minicolors-initialized'))
                                        {
                                            return;
                                        }
                                        switch(event.keyCode)
                                        {
                                            case 9: // tab
                                                if(settings.showRGB)
                                                {
                                                    event.stopPropagation();
                                                }
                                                break;
                                        }
                                    })
                                    .on('keydown', function(event)
                                    {
                                        if(
                                            event.which === 8       //backspace
                                            || event.which === 46   //delete
                                            || (!event.metaKey && !event.ctrlKey)
                                            && (
                                                (event.which >= 48 && event.which <= 70)     // 0-9, a-f
                                                || (event.which >= 96 && event.which <= 105)    // num0-9
                                            )
                                        )
                                        {
                                            resetOpacity(event);
                                        }
                                    })
                                    // Update on paste
                                    .on('paste', resetOpacity)
                                    .on('blur', hideIfFocusLeft);

                                    eventsBound = true;
                                }
                            }
                        };

                        function resetOpacity(event)
                        {
                            $timeout(function()
                            {
                                if(isHex(ngModel.$viewValue) && event.target && event.target.getAttribute('data-opacity'))
                                {
                                    event.target.setAttribute('data-opacity', 1);
                                    // Manually Set swatch opacity as it doesn't automatically do it
                                    var swatch = $(this).siblings('.minicolors-input-swatch');
                                    swatch.find('span').css({
                                        opacity: 1
                                    });
                                }
                            }, 0);
                        }

                        function hideIfFocusLeft(event)
                        {
                            var focusLeftControl = event.relatedTarget && !$.contains(
                                $(event.target).parents('.minicolors')[0],
                                event.relatedTarget
                            );
                            if(focusLeftControl)
                            {
                                element.minicolors('hide');
                            }
                        }

                        //destroy the old colorpicker if one already exists
                        if(element.hasClass('minicolors-input'))
                        {
                            element.minicolors('destroy');
                            element.off('blur', onBlur);
                        }

                        // Create the new minicolors widget
                        element.minicolors(settings);

                        // hook up into the jquery-minicolors onBlur event.
                        element.on('blur', onBlur);

                        // are we inititalized yet ?
                        //needs to be wrapped in $timeout, to prevent $apply / $digest errors
                        //$scope.$apply will be called by $timeout, so we don't have to handle that case
                        if(!inititalized)
                        {
                            $timeout(function()
                            {
                                var color = ngModel.$viewValue;
                                setMinicolorsValue(color);
                            }, 0);
                            inititalized = true;
                            return;
                        }

                        function onBlur(e)
                        {
                            scope.$apply(function()
                            {
                                var color = element.minicolors('value');
                                if(isValidColor(color))
                                {
                                    ngModel.$setViewValue(color);
                                }
                            });
                        }
                    };

                    initMinicolors();
                    //initital call

                    // Watch for changes to the directives options and then call init method again
                    var unbindWatch = scope.$watch(getSettings, initMinicolors, true);

                    scope.$on('$destroy', function()
                    {
                        if(element.hasClass('minicolors-input'))
                        {
                            element.minicolors('destroy');
                            element.remove();
                        }
                        if(unbindWatch)
                        {
                            unbindWatch();
                        }
                        if(colorWatch)
                        {
                            colorWatch();
                        }
                    });

                }
            };
        }
    ]);
});
