'use strict';

class Tagging
{
	constructor(editor, options = {})
	{
		this.delay = options.delay || 500;
		this.editor = editor;
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

		// add a small additional offset to move
		// the dropdown a little bit away from
		// the inserted text
		top = top + 5;

		return { top: top, left: left };
	}

	clear(tag)
	{
		this.editor.getElement().parentElement.removeChild(this.dropdown);
		delete this.dropdown;
		tag.tracking = '';
	}

	highlighted_list_item(tag)
	{
		var current_active = this.dropdown.querySelector('li.active');
		if(current_active)
		{
			var item = tag.items[tag.items.findIndex(function(item) { return item[tag.selector] === current_active.innerText })];
			var content = this.editor.getContent();
			content = content.replace(tag.tracking, tag.insert(item, tag));
			this.editor.setContent(content);
			this.clear(tag);
            this.editor.focus();
            this.editor.selection.select(this.editor.getBody());
            this.editor.selection.collapse(false);
		}
	}

	highlight_next_list_item()
	{
		var current_active = this.dropdown.querySelector('li.active');
		if(current_active !== null)
		{
			var index = ([...this.dropdown.children].indexOf(current_active)) + 1;
			var child = this.dropdown.childNodes[index];
			if(child)
			{
				current_active.classList.remove('active');
				this.dropdown.childNodes[index].classList.add('active');
			}
		} else
		{
			var child = this.dropdown.childNodes[0];
			if(child)
			{
				this.dropdown.childNodes[0].classList.add('active');
			}
		}
	}

	highlight_previous_list_item()
	{
		var current_active = this.dropdown.querySelector('li.active');
		if(current_active !== null)
		{
			var index = ([...this.dropdown.children].indexOf(current_active)) - 1;
			var child = this.dropdown.childNodes[index];
			if(child)
			{
				current_active.classList.remove('active');
				this.dropdown.childNodes[index].classList.add('active');
			}
		} else
		{
			var child = this.dropdown.childNodes[0];
			if(child)
			{
				this.dropdown.childNodes[0].classList.add('active');
			}
		}
	}

	insert(item, tag)
	{
		return '<span data-tagging-id="' + item[tag.selector] + '">' + item[tag.selector] + '</span>';
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
			tag.source instanceof Function ? tag.source(query, _self.search.bind(_self, tag)) : _self.search(tag, tag.source);
		}, this.delay);
	}

	on_keyup(tag, e)
	{
		switch(e.keyCode)
		{
			// BACKSPACE
			case 8:
				tag.tracking = tag.tracking.slice(0, -1);
				if(tag.tracking === '')
				{
					this.clear(tag);
					break;
				}
				this.lookup(tag);
				break;

			// ENTER
			case 13:
				e.preventDefault();
				if(this.dropdown)
				{
					this.highlighted_list_item(tag);
				}
				break;

			// UP ARROW
			case 38:
				e.preventDefault();
				if(this.dropdown)
				{
					this.highlight_previous_list_item();
				}
				break;

			// DOWN ARROW
			case 40:
				e.preventDefault();
				if(this.dropdown)
				{
					this.highlight_next_list_item();
				}
				break;

			// ANY OTHER
			default:
				tag.tracking = tag.tracking + String.fromCharCode(e.keyCode);
				this.lookup(tag);
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

	search(tag, items)
	{
		if(this.dropdown)
		{
			this.dropdown.innerHTML = '';
			for(var i = 0; i < items.length; i++)
			{
				var elem = this.render(items[i], tag.selector);
				this.dropdown.append(elem);
			}
		}
		tag.items = items;
	}

	set_tags(options)
	{
		for(const item of Object.values(options))
		{
			this.tags[item.delimeter] = {
				delimeter: item.delimeter,
				insert: item.insert || this.insert,
				items: [],
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
		this.on_keyup(tag, e);

		if(tag.tracking === '')
		{
			return null;
		}

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