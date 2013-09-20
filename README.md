typation.js
===========

typing javascript animation (in a jquery plugin)


Features
--------

* random pauses
* random errors automatically inserted (and then corrected)
* skip and fast-forward
* append (you can add text to the animation)

*more coming...*

Usage
-----

``` javascript
$("#text_container").typation({  
	to_type : 'Nulla facilisi. Duis aliquet egestas purus in blandit.\nCurabitur vulputate, scelerisque.'  
});
```

Options
-------

``` javascript
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
```

*more coming...*
