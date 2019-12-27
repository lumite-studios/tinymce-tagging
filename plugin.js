'use strict';

class Tagging
{	
	/**
	 * Build the class data.
	 *
	 * @param
	 * @param object options
	 * @return void
	 */
	constructor(editor, options = {})
	{
		this.delay = options.delay || 500
		this.editor = editor
		this.id = this.generateID()
		this.emptyMessage = options.emptyMessage || 'There are no items.'
		this.loadingMessage = options.loadingMessage || 'Loading...'
		this.tags = {}
		this.setOptions(options.tags)
	}

	/**
	 * Calculate what position to show the
	 * tiny tags container.
	 *
	 * @return object
	 */
	calculatePosition()
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

	/**
	 * Clear the tag.
	 *
	 * @param
	 * @return void
	 */
	clear(tag)
	{
		// remove the tiny tags container
		const container = document.getElementById('tiny-tags-'+this.id)
		if(container !== null)
		{
			this.editor.getElement().parentElement.removeChild(container)
		}
		
		// stop tracking
		tag.tracking = ''
	}

	/**
	 * The default insert for a tag.
	 *
	 * @param
	 * @param
	 * @return string
	 */
	defaultInsert(item, tag)
	{
		return '<span data-tagging-id="' + item[tag.selector] + '">' + item[tag.title] + '</span>';
	}

	/**
	 * Display a message within the container.
	 *
	 * @param string message
	 * @return void
	 */
	displayContainerMessage(text)
	{
		const container = document.getElementById('tiny-tags-'+this.id)
		container.innerHTML = ''
		const message = document.createElement('div')
		message.setAttribute('class', 'tiny-tags-message')
		message.innerHTML = text
		container.appendChild(message)
	}

	/**
	 * Generate a random id.
	 *
	 * @param integer length
	 * @return string
	 */
	generateID(length = 10)
	{
		let result = ''
		const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
		const charactersLength = characters.length
		for(let i = 0; i < length; i++)
		{
			result += characters.charAt(Math.floor(Math.random() * charactersLength))
		}
		return result
	}

	/**
	 * Highlight the next item in the dropdown.
	 *
	 * @return void
	 */
	highlightNextItem()
	{
		const container = document.getElementById('tiny-tags-'+this.id)

		// try to fetch the currently active list item
		const active = container.querySelector('li.tiny-tags-item-active')
		let child

		if(active === null)
		{
			child = container.querySelector('li.tiny-tags-item')
		} else
		{
			active.setAttribute('class', 'tiny-tags-item')
			child = active.nextSibling
		}

		if(child !== null)
		{
			child.setAttribute('class', 'tiny-tags-item tiny-tags-item-active')
		}
	}

	/**
	 * Highlight the previous item in the dropdown.
	 *
	 * @return void
	 */
	highlightPreviousItem()
	{
		const container = document.getElementById('tiny-tags-'+this.id)

		// try to fetch the currently active list item
		const active = container.querySelector('li.tiny-tags-item-active')
		let child

		if(active === null)
		{
			child = container.querySelector('li.tiny-tags-item')
		} else
		{
			active.setAttribute('class', 'tiny-tags-item')
			child = active.previousSibling
		}

		if(child !== null)
		{
			child.setAttribute('class', 'tiny-tags-item tiny-tags-item-active')
		}
	}

	/**
	 * Lookup the tag.
	 *
	 * @param object tag
	 * @return void
	 */
	lookup(tag)
	{
		// set the loading message
		this.displayContainerMessage(this.loadingMessage)

		// remove the delimeter from the tag in order to search
		const query = tag.tracking.replace(tag.delimeter, '')

		clearTimeout(this.searching)
		this.searching = setTimeout(() =>
		{
			tag.source(query, this.render.bind(this, tag))
		}, this.delay)
	}

	/**
	 * Do something as the tag is typed out.
	 *
	 * @param object tag
	 * @param object e
	 * @return
	 */
	onKeyup(tag, e)
	{
		switch(e.keyCode)
		{
			// BACKSPACE
			case 8:
				tag.tracking = tag.tracking.slice(0, -1)
				if(tag.tracking === '')
				{
					this.clear(tag)
					break
				}
				this.lookup(tag)
				break

			// ENTER
			case 13:
				e.preventDefault()
				this.selectActiveItem(tag)
				break

			// UP ARROW
			case 38:
				e.preventDefault()
				this.highlightPreviousItem()
				break

			// DOWN ARROW
			case 40:
				e.preventDefault()
				this.highlightNextItem()
				break

			// ANY OTHER
			default:
				tag.tracking = tag.tracking + String.fromCharCode(e.keyCode)
				this.lookup(tag)
				break
		}
	}

	/**
	 * Render the "tiny-tags" container.
	 *
	 * @return void
	 */
	renderContainer()
	{
		// fetch the editor and set the containing
		// to relative position
		const editor = this.editor.getElement()
		editor.parentElement.style.position = 'relative'

		// build the container
		const position = this.calculatePosition()
		let container = document.createElement('div')
		container.setAttribute('class', 'tiny-tags')
		container.setAttribute('id', 'tiny-tags-'+this.id)
		container.style.top = position.top + 'px'
		container.style.left = position.left + 'px'

		// append the container to the editor's parent
		editor.parentElement.appendChild(container)
	}

	/**
	 * Render the dropdown of the items.
	 *
	 * @param object tag
	 * @param array items
	 * @return void
	 */
	render(tag, items)
	{
		// fetch the container
		const container = document.getElementById('tiny-tags-'+this.id)

		// are there any items?
		if(items.length !== 0)
		{
			// build the dropdown
			let ul = document.createElement('ul')
			ul.setAttribute('class', 'tiny-tags-list')
			for(let i = 0; i < items.length; i++)
			{
				const li = document.createElement('li')
				li.setAttribute('class', 'tiny-tags-item')
				li.setAttribute('data-tagging-id', items[i][tag.selector])
				li.innerHTML = items[i][tag.title]
				li.addEventListener('click', () =>
				{
					this.insertItem(items[i], tag)
				})
				ul.append(li)
			}
			container.innerHTML = ''
			container.appendChild(ul)
		} else
		{
			this.displayContainerMessage(this.emptyMessage)
		}

		tag.items = items
	}

	/**
	 * Select the currently active item.
	 *
	 * @param object tag
	 * @return
	 */
	selectActiveItem(tag)
	{
		// try to fetch the currently active list item
		const container = document.getElementById('tiny-tags-'+this.id)
		const active = container.querySelector('li.tiny-tags-item-active')

		if(active)
		{
			// fetch the tag from the tag list
			const item = tag.items[tag.items.findIndex((item) => 
				{
					return item[tag.selector] === active.getAttribute('data-tagging-id')
				}
			)]

			this.insertItem(item, tag)
		}
	}

	/**
	 * Insert the item into the editor.
	 *
	 * @param object item
	 * @param object tag
	 * @return void
	 */
	insertItem(item, tag)
	{
		let content = this.editor.getContent()
		content = content.replace(tag.tracking, tag.insert(item, tag))
		this.editor.setContent(content)
		this.clear(tag)
		this.editor.focus()
		this.editor.selection.select(this.editor.getBody())
		this.editor.selection.collapse(false)
	}

	/**
	 * Set the plugin options.
	 * 
	 * @param object options
	 * @return void
	 */
	setOptions(options)
	{
		for(const item of Object.values(options))
		{
			this.tags[item.delimeter] = {
				delimeter: item.delimeter,
				insert: item.insert || this.defaultInsert,
				items: [],
				selector: item.selector,
				title: item.title || item.selector,
				source: item.source,
				tracking: '',
			};
		}
	}

	/**
	 * Track the tag as its typed.
	 *
	 * @param object tag
	 * @param object e
	 * @return string
	 */
	trackTag(tag, e)
	{
		// check if we need to do something
		// with the key press
		this.onKeyup(tag, e)

		// return empty or the tag
		if(tag.tracking === '')
		{
			return null
		}
		return tag
	}
}

tinymce.create('tinymce.plugins.tag',
{
	init: function(editor)
	{
		// initialise our Tagging class with
		// our editor and any options
		const tagging = new Tagging(editor, editor.getParam('tagging'))
		let track = null

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
					tagging.renderContainer()
					const tag = tagging.tags[String.fromCharCode(e.keyCode)]
					track = tagging.trackTag(tag, e)
				}
			} else
			{
				track = tagging.trackTag(track, e);
			}
		});

		// needed for tracking backspace, arrow presses
		editor.on('keydown', function(e)
		{
			if(track !== null)
			{
				if(e.keyCode === 8 || e.keyCode === 38 || e.keyCode === 40 || e.keyCode === 13)
				{
					track = tagging.trackTag(track, e);
				}
			}
		});
	}
});

tinymce.PluginManager.add('tag', tinymce.plugins.tag);