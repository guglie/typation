/* typation.js - v0.2.1 - 2013
 * --
 * Distributed under MIT License:
 * Copyright (c) 2013 Guglielmo Cassinelli
 */


(function( $ ) {

	var methods = {
    	init : function( options ) { 
			typ = this;
	
	      	typ.settings = $.extend( {
				to_type : '',
				begin_delay : 1000,
				min_type_delay : 50,
				max_type_delay : 100,
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
			typ.error_map = {
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
			typ.States = {
				TYPING : 1, 
				CORRECTING : 2,
				STOP : 3
			};
			typ.Ops = {
				TYPE : 1,
				PAUSE : 2,
				ERROR : 3,
				ERRFOUND : 4
			};
			typ.Errors = {
				INSERT : 1,
				DELETE : 2
			}
			
			if (Object.freeze) {
				Object.freeze(typ.States);
				Object.freeze(typ.Ops);
			}
			
			// variables
			typ.curr_state = typ.States.TYPING;
			typ.typed_count = 0;
			typ.ffwd = false;
			typ.str_typed = '';
			typ.str_to_type = typ.settings.to_type;
			typ.errors = [];
			
			// create cursor and begin...
			methods.createCursor();
			typ.beginTimeout = setTimeout(methods.update,typ.settings.begin_delay);
			
			return at;
	    },
	
		append : function(to_type) {
			typ.str_to_type += to_type;
			
			if(typ.curr_state == typ.States.STOP) {
				typ.curr_state = typ.States.TYPING;
				typ.beginTimeout = setTimeout(methods.update,typ.settings.begin_delay);
				
				if(!typ.cursorBlinking) {
					methods.cursorBlink();
				}
			}
			
			
		},
		update : function() {
			if(typ.curr_state == typ.States.CORRECTING) {
				methods.correct();
			} else if(typ.errors.length != 0 && Math.random() < typ.settings.find_error_prob) {
				//errors found, correct them
				typ.curr_state = typ.States.CORRECTING;
				methods.updateDelay('found');
				return;
			} else if(typ.str_to_type.length != 0) {
				//queue not empty
				
				if(Math.random() < typ.settings.error_prob) {
					methods.makeError();
				} else if(Math.random() < typ.settings.pause_prob) {
					methods.updateDelay('pause');
					return;
				} else {
					methods.typeChar();
					methods.updateDelay('typed');
				}
			} else {
				//the queue is empty
				typ.curr_state = typ.States.STOP;
				
				//call end callback
				if($.isFunction(typ.settings.endCallback)) {
					typ.settings.endCallback.call();
				}
			}
			
		},
		correct : function() {
			//there is an error here?
			for(var i=typ.errors.length-1; i>=0; i--) {
				if(typ.errors[i].pos == typ.typed_count) {
					//error here, correct it
					
					if(typ.errors[i].err == typ.Errors.INSERT) {
						typ.str_to_type = typ.str_to_type.substr(1);
					} else { // correcting DELETE
						typ.str_to_type = typ.errors[i].character + typ.str_to_type;
					}
					
					typ.errors.splice(i,1);
				}
			}
			
			//all the errors corrected?
			if(typ.errors.length == 0) {
				typ.curr_state = typ.States.TYPING;
				
			} else {
				//else backspace...
				
				typ.$cursor.remove();
				
				//remove last char
				var last_char = typ.str_typed.charAt(typ.str_typed.length-1);
				typ.str_typed = typ.str_typed.substr(0,typ.str_typed.length-1);
				
				//append it to queue
				typ.str_to_type = last_char + typ.str_to_type;

				typ.typed_count--;

				typ.text(typ.str_typed);
				typ.append(typ.$cursor);
			}
			
			methods.updateDelay('typed');
		},
		makeError : function() {
			//insertion or deletion
			if(Math.random() < 0.5) {
				
				//insertion
				//var randomChar = typ.settings.error_characters.charAt(Math.floor(Math.random()*typ.settings.error_characters.length));
				
				//random "key" near last "key pressed"
				var last_char = typ.str_typed.charAt(typ.str_typed.length-1);
				last_char = last_char.toLowerCase();
				
				//insert only if key is on map
				if(!!typ.error_map[last_char]) {
					var near_keys = typ.error_map[last_char];
					var randomChar = near_keys.charAt(Math.floor(Math.random()*near_keys.length));
					
					typ.errors.push({
						err : typ.Errors.INSERT,
						pos : typ.typed_count
					});
					
					typ.str_to_type = randomChar+typ.str_to_type;
				}
				
			} else {
				var deletedChar = typ.str_to_type.charAt(0);
				
				typ.errors.push({
					err : typ.Errors.DELETE,
					pos : typ.typed_count, 
					character : deletedChar
				});
				
				//deletion
				typ.str_to_type = typ.str_to_type.substr(1);
			}
			
			methods.typeChar();
			methods.updateDelay('error');
		},
		skip : function() {
			if(typ.curr_state == typ.States.STOP) {
				return;
			}
			
			methods.clearTimers();
			typ.$cursor.remove();
			typ.append(typ.str_to_type);
			typ.str_typed += typ.str_to_type;
			typ.str_to_type = '';
			typ.append(typ.$cursor);
			
			typ.curr_state = typ.States.STOP;
			
			if($.isFunction(typ.settings.endCallback)) {
				typ.settings.endCallback.call();
			}
			
			return at;
		},
		ffwd : function() {
			if(typ.curr_state == typ.States.STOP) {
				return;
			}
			
			typ.ffwd = true;
			methods.clearTimers();
			
			typ.settings = $.extend(typ.settings,{
				begin_delay : 0,
				min_type_delay : 0,
				max_type_delay : 0
			});
			
			methods.update();
		},
		consumeChar : function(a_str) {
			var first_char = typ.str_to_type.charAt(0);
			typ.str_to_type = typ.str_to_type.substr(1);
			return first_char;
		},
		
		typeChar : function() {
			var char_to_type = methods.consumeChar();
			
			typ.str_typed += char_to_type;
			
			typ.typed_count++;
			
			typ.$cursor.remove();
			typ.append(char_to_type);
			typ.append(typ.$cursor);
		},
		
		clearTimers : function() {
			clearTimeout(typ.finalTimeout);
			clearTimeout(typ.beginTimeout);
			clearTimeout(typ.charTimeout);
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
					min_delay = typ.settings.min_type_delay;
					max_delay = typ.settings.max_type_delay;
					break;
				case 'found':
					min_delay = typ.settings.min_found_delay;
					max_delay = typ.settings.max_found_delay;
					break;
				case 'pause':
					min_delay = typ.settings.min_pause_delay;
					max_delay = typ.settings.max_pause_delay;				
					break;
			}
			
			
			//random delay
			if(!typ.ffwd) {
				interval = methods.randomBetween(min_delay,max_delay);
			} else {
				interval = 0;
			}
			
			typ.charTimeout = setTimeout(methods.update,interval);
			
			//call update callback
			if($.isFunction(typ.settings.updateCallback)) {
				typ.settings.updateCallback.call();
			}
		},
		
		createCursor : function() {
			typ.append('<span id="at-cursor">|</span>');
			typ.$cursor = $('#at-cursor');
			typ.$cursor.isVisible = true;
			typ.$cursor.css({
				'font-family':'arial,sans-serif',
				'color':typ.settings.cursor_color,
				'line-height':'0.9em'
			});
			
			methods.cursorBlink();
		},
		cursorBlink : function() {
			typ.cursorBlinking = true;
			
			typ.cursor_interval = setInterval(function(){
				if(typ.$cursor.isVisible) {
					typ.$cursor.css('visibility','hidden');
				} else {
					typ.$cursor.css('visibility','visible');
					//typ.$cursor.text('|');
				}
				typ.$cursor.isVisible = !typ.$cursor.isVisible;
				
				//typ.$cursor.toggle();
				
			},typ.settings.cursor_blink);
		},
		
		clearCursor : function() {
			typ.cursorBlinking = false;
			
			//remove the blinking cursor
			clearInterval(typ.cursor_interval);
			typ.$cursor.remove();
		},
		
		randomBetween : function(x, y) {
			return Math.round(Math.random()*(y-x)+x);
		}
	};
	
	$.fn.typation = function( method ) {
	    if ( methods[method] ) {
	      return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
	    } else if ( typeof method === 'object' || ! method ) {
	      return methods.init.apply( this, arguments );
	    } else {
	      $.error( 'Method ' +  method + ' does not exist on jQuery.typation' );
	    }
	};

})( jQuery );