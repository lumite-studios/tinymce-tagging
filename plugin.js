'use strict';

class Tagging
{
	constructor(editor, options = {})
	{
		this.editor = editor;
		this.delay = options.delay || 500;
		this.tags = {};
		this.set_tags(options.tags);
	}

	calculate_position()
	{
		var top = 0;
		var left = 0;

		// add the position of the entire tinymce
		// element to the top and left
		top = top + this.editor.getElement().offsetTop;
		left = left + this.editor.getElement().offsetLeft;

		// also add the actual area of the inner
		// tinymce area to our position
		top = top + this.editor.getContentAreaContainer().offsetTop;
		left = left + this.editor.getContentAreaContainer().offsetLeft;

		// also use the current node to offset
		// the position as well
		top = top + this.editor.selection.getNode().offsetTop;
		top = top + this.editor.selection.getNode().clientHeight;

		if(this.editor.selection.getRng().getClientRects().length > 0)
		{
			left = left + this.editor.selection.getRng().getClientRects()[0].left;
		} else
		{
			left = left + this.editor.selection.getNode().offsetLeft;
		}

		//
		top = top + 5;

		return { top: top, left: left };
	}

	clear()
	{
		this.editor.getElement().parentElement.removeChild(this.dropdown);
		delete this.dropdown;
	}

	highlighted_list_item()
	{
	}

	highlight_next_list_item()
	{
	}

	highlight_previous_list_item()
	{
	}

	lookup(tag)
	{
		var _self = this;
		if(typeof this.dropdown === 'undefined')
		{
			this.show();
		}

		var query = tag.tracking.replace(tag.delimeter, '');

		clearTimeout(this.searching);
		this.searching = setTimeout(function()
		{
			tag.source instanceof Function ? tag.source(query, _self.search.bind(_self, tag.selector)) : _self.search(tag.selector, tag.source);
		}, this.delay);
	}

	on_keyup(tracking, e)
	{
		switch(e.keyCode)
		{
			// BACKSPACE
			case 8:
				return tracking.slice(0, -1);
				break;

			// ENTER
			case 13:
				e.preventDefault();
				if(this.dropdown)
				{
					this.highlighted_list_item();
				}
				return tracking;
				break;

			// UP ARROW
			case 38:
				e.preventDefault();
				if(this.dropdown)
				{
					this.highlight_previous_list_item();
				}
				return tracking;
				break;

			// DOWN ARROW
			case 40:
				e.preventDefault();
				if(this.dropdown)
				{
					this.highlight_next_list_item();
				}
				return tracking;
				break;

			// ANY OTHER
			default:
				return tracking + String.fromCharCode(e.keyCode);
				break;
		}
	}

	render(item, selector)
	{
		var li = document.createElement('li');
		li.setAttribute('class', 'item');
		li.innerHTML = item[selector];
		return li;
	}

	render_dropdown()
	{
		var position = this.calculate_position();
		var ul = document.createElement('ul');
		ul.setAttribute('class', 'tiny-tags');
		ul.style.top = position.top;
		ul.style.left = position.left;
		return ul;
	}

	search(selector, items)
	{
		if(this.dropdown)
		{
			this.dropdown.innerHTML = '';
			for(var i = 0; i < items.length; i++)
			{
				var elem = this.render(items[i], selector);
				this.dropdown.append(elem);
			}
		}
	}

	set_tags(options)
	{
		for(const item of Object.values(options))
		{
			this.tags[item.delimeter] = {
				delimeter: item.delimeter,
				selector: item.selector,
				source: item.source,
				tracking: '',
			};
		}
	}

	show()
	{
		this.dropdown = this.render_dropdown();
		this.editor.getElement().parentElement.appendChild(this.dropdown);
	}

	track_tag(tag, e)
	{
		tag.tracking = this.on_keyup(tag.tracking, e);

		if(tag.tracking === '')
		{
			this.clear();
			return null;
		}

		this.lookup(tag);

		return tag;
	}
}

tinymce.create('tinymce.plugins.tag',
{
	init: function(editor)
	{
		// initialise our Tagging class with
		// our editor and any options
		var tagging = new Tagging(editor, editor.getParam('tagging'));
		var track = null;

		editor.on('keypress', function(e)
		{
			// check if we are already tracking a tag
			if(track === null)
			{
				// we are not tracking a tag, so lets see
				// if the entered character is one of the
				// available delimeters, and if so, start
				// tracking the new tag
				if(typeof tagging.tags[String.fromCharCode(e.keyCode)] !== 'undefined')
				{
					var tag = tagging.tags[String.fromCharCode(e.keyCode)];
					track = tagging.track_tag(tag, e);
				}
			} else
			{
				track = tagging.track_tag(track, e);
			}
		});

		// needed for tracking backspace, arrow presses
		editor.on('keydown', function(e)
		{
			if(track !== null)
			{
				if(e.keyCode === 8 || e.keyCode === 38 || e.keyCode === 40 || e.keyCode === 13)
				{
					track = tagging.track_tag(track, e);
				}
			}
		});
	}
});

tinymce.PluginManager.add('tag', tinymce.plugins.tag);