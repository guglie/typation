/* typation.js - v0.2.1 - 2013
 * --
 * Distributed under MIT License:
 * Copyright (c) 2013 Guglielmo Cassinelli
 */


(function( $ ) {

	var methods = {
    	init : function( options ) { 
			at = this;
	
	      	at.settings = $.extend( {
				to_type : '',
				begin_delay : 1000,
				min_type_delay : 8,
				max_type_delay : 90,
				min_found_delay : 300,
				max_found_delay : 800,
				min_pause_delay : 200,
				max_pause_delay : 600,
				cursor_blink : 600,
				cursor_color : '#DAD085',
				error_prob : 0.01,
				find_error_prob : 0.25,
				pause_prob : 0.03,
				updateCallback : function(){},
				endCallback : function(){}
			}, options);
			
			// define simple error map
			at.error_map = {
				'1' : '2q',
				'2' : '1qw3',
				'3' : '2we4',
				'4' : '3er5',
				'5' : '4rt6',
				'6' : '5ty7',
				'7' : '6yu8',
				'8' : '7ui9',
				'9' : '8io0',
				'0' : '9op',
				'q' : '12wa',
				'w' : 'q23esa',
				'e' : 'w34rds',
				'r' : 'e45tfd',
				't' : 'r56ygf',
				'y' : 't67uhg',
				'u' : 'y78ijh',
				'i' : 'u89okj',
				'o' : 'i90plk',
				'p' : 'o0l',
				'a' : 'qwsz',
				's' : 'awedxz',
				'd' : 'serfcx',
				'f' : 'drtgvc',
				'g' : 'ftyhbv',
				'h' : 'gyujnb',
				'j' : 'huikmn',
				'k' : 'jiolm',
				'l' : 'kop',
				'z' : 'asx',
				'x' : 'zsdc',
				'c' : 'xdfv',
				'v' : 'cfgb',
				'b' : 'vghn',
				'n' : 'bhjm',
				'm' : 'njk'
			};
			
			// define "enums"
			at.States = {
				TYPING : 1, 
				CORRECTING : 2,
				STOP : 3
			};
			at.Ops = {
				TYPE : 1,
				PAUSE : 2,
				ERROR : 3,
				ERRFOUND : 4
			};
			at.Errors = {
				INSERT : 1,
				DELETE : 2
			}
			
			if (Object.freeze) {
				Object.freeze(at.States);
				Object.freeze(at.Ops);
			}
			
			// variables
			at.curr_state = at.States.TYPING;
			at.typed_count = 0;
			at.ffwd = false;
			at.str_typed = '';
			at.str_to_type = at.settings.to_type;
			at.errors = [];
			
			// create cursor and begin...
			methods.createCursor();
			at.beginTimeout = setTimeout(methods.update,at.settings.begin_delay);
			
			return at;
	    },
	
		append : function(to_type) {
			at.str_to_type += to_type;
			
			if(at.curr_state == at.States.STOP) {
				at.curr_state = at.States.TYPING;
				at.beginTimeout = setTimeout(methods.update,at.settings.begin_delay);
				
				if(!at.cursorBlinking) {
					methods.cursorBlink();
				}
			}
			
			
		},
		update : function() {
			if(at.curr_state == at.States.CORRECTING) {
				methods.correct();
			} else if(at.errors.length != 0 && Math.random() < at.settings.find_error_prob) {
				//errors found, correct them
				at.curr_state = at.States.CORRECTING;
				methods.updateDelay('found');
				return;
			} else if(at.str_to_type.length != 0) {
				//queue not empty
				
				if(Math.random() < at.settings.error_prob) {
					methods.makeError();
				} else if(Math.random() < at.settings.pause_prob) {
					methods.updateDelay('pause');
					return;
				} else {
					methods.typeChar();
					methods.updateDelay('typed');
				}
			} else {
				//the queue is empty
				at.curr_state = at.States.STOP;
				
				//call end callback
				if($.isFunction(at.settings.endCallback)) {
					at.settings.endCallback.call();
				}
			}
			
		},
		correct : function() {
			//there is an error here?
			for(var i=at.errors.length-1; i>=0; i--) {
				if(at.errors[i].pos == at.typed_count) {
					//error here, correct it
					
					if(at.errors[i].err == at.Errors.INSERT) {
						at.str_to_type = at.str_to_type.substr(1);
					} else { // correcting DELETE
						at.str_to_type = at.errors[i].character + at.str_to_type;
					}
					
					at.errors.splice(i,1);
				}
			}
			
			//all the errors corrected?
			if(at.errors.length == 0) {
				at.curr_state = at.States.TYPING;
				
			} else {
				//else backspace...
				
				at.$cursor.remove();
				
				//remove last char
				var last_char = at.str_typed.charAt(at.str_typed.length-1);
				at.str_typed = at.str_typed.substr(0,at.str_typed.length-1);
				
				//append it to queue
				at.str_to_type = last_char + at.str_to_type;

				at.typed_count--;

				at.text(at.str_typed);
				at.append(at.$cursor);
			}
			
			methods.updateDelay('typed');
		},
		makeError : function() {
			//insertion or deletion
			if(Math.random() < 0.5) {
				
				//insertion
				//var randomChar = at.settings.error_characters.charAt(Math.floor(Math.random()*at.settings.error_characters.length));
				
				//random "key" near last "key pressed"
				var last_char = at.str_typed.charAt(at.str_typed.length-1);
				last_char = last_char.toLowerCase();
				
				//insert only if key is on map
				if(!!at.error_map[last_char]) {
					var near_keys = at.error_map[last_char];
					var randomChar = near_keys.charAt(Math.floor(Math.random()*near_keys.length));
					
					at.errors.push({
						err : at.Errors.INSERT,
						pos : at.typed_count
					});
					
					at.str_to_type = randomChar+at.str_to_type;
				}
				
			} else {
				var deletedChar = at.str_to_type.charAt(0);
				
				at.errors.push({
					err : at.Errors.DELETE,
					pos : at.typed_count, 
					character : deletedChar
				});
				
				//deletion
				at.str_to_type = at.str_to_type.substr(1);
			}
			
			methods.typeChar();
			methods.updateDelay('error');
		},
		skip : function() {
			if(at.curr_state == at.States.STOP) {
				return;
			}
			
			methods.clearTimers();
			at.$cursor.remove();
			at.append(at.str_to_type);
			at.str_typed += at.str_to_type;
			at.str_to_type = '';
			at.append(at.$cursor);
			
			at.curr_state = at.States.STOP;
			
			if($.isFunction(at.settings.endCallback)) {
				at.settings.endCallback.call();
			}
			
			return at;
		},
		ffwd : function() {
			if(at.curr_state == at.States.STOP) {
				return;
			}
			
			at.ffwd = true;
			methods.clearTimers();
			
			at.settings = $.extend(at.settings,{
				begin_delay : 0,
				min_type_delay : 0,
				max_type_delay : 0
			});
			
			methods.update();
		},
		consumeChar : function(a_str) {
			var first_char = at.str_to_type.charAt(0);
			at.str_to_type = at.str_to_type.substr(1);
			return first_char;
		},
		
		typeChar : function() {
			var char_to_type = methods.consumeChar();
			
			at.str_typed += char_to_type;
			
			at.typed_count++;
			
			at.$cursor.remove();
			at.append(char_to_type);
			at.append(at.$cursor);
		},
		
		clearTimers : function() {
			clearTimeout(at.finalTimeout);
			clearTimeout(at.beginTimeout);
			clearTimeout(at.charTimeout);
		},
		
		/**
		op:
		'found' (error found),
		'error' (error generated),
		'pause' (random pause),
		'typed' (typed character),
		*/
		updateDelay : function(op) {
			var min_delay, max_delay;
			
			
			switch(op) {
				case 'typed':
				case 'error':
					min_delay = at.settings.min_type_delay;
					max_delay = at.settings.max_type_delay;
					break;
				case 'found':
					min_delay = at.settings.min_found_delay;
					max_delay = at.settings.max_found_delay;
					break;
				case 'pause':
					min_delay = at.settings.min_pause_delay;
					max_delay = at.settings.max_pause_delay;				
					break;
			}
			
			
			//random delay
			if(!at.ffwd) {
				interval = methods.randomBetween(min_delay,max_delay);
			} else {
				interval = 0;
			}
			
			at.charTimeout = setTimeout(methods.update,interval);
			
			//call update callback
			if($.isFunction(at.settings.updateCallback)) {
				at.settings.updateCallback.call();
			}
		},
		
		createCursor : function() {
			at.append('<span id="at-cursor">|</span>');
			at.$cursor = $('#at-cursor');
			at.$cursor.isVisible = true;
			at.$cursor.css({
				'font-family':'arial,sans-serif',
				'color':at.settings.cursor_color,
				'line-height':'0.9em'
			});
			
			methods.cursorBlink();
		},
		cursorBlink : function() {
			at.cursorBlinking = true;
			
			at.cursor_interval = setInterval(function(){
				if(at.$cursor.isVisible) {
					at.$cursor.css('visibility','hidden');
				} else {
					at.$cursor.css('visibility','visible');
					//at.$cursor.text('|');
				}
				at.$cursor.isVisible = !at.$cursor.isVisible;
				
				//at.$cursor.toggle();
				
			},at.settings.cursor_blink);
		},
		
		clearCursor : function() {
			at.cursorBlinking = false;
			
			//remove the blinking cursor
			clearInterval(at.cursor_interval);
			at.$cursor.remove();
		},
		
		randomBetween : function(x, y) {
			return Math.round(Math.random()*(y-x)+x);
		}
	};
	
	$.fn.animaType = function( method ) {
	    if ( methods[method] ) {
	      return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
	    } else if ( typeof method === 'object' || ! method ) {
	      return methods.init.apply( this, arguments );
	    } else {
	      $.error( 'Method ' +  method + ' does not exist on jQuery.animaType' );
	    }
	};

})( jQuery );