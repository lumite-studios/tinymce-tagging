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
		this.delimeter = options.delimeter
		this.editor = editor
		this.emptyMessage = options.emptyMessage || 'There are no results.'
		this.id = this.generateID()
		this.insert = options.insert || this.defaultInsert
		this.items = []
		this.limit = options.limit || 10
		this.loadingMessage = options.loadingMessage || 'Loading...'
		this.selector = options.selector
		this.source = options.source
		this.tags = {}
		this.title = options.title || options.selector
		this.tracking = ''

		this.renderDropdown()
		this.renderContainer()
		this.bindEvents()
	}

	/**
	 * Bind events to the tinymce editor.
	 *
	 * @return void
	 */
	bindEvents()
	{
		this.editor.on('keydown', this.keydownProxy = (event) => { this.onKeydown(event) }, true)
		this.editor.on('keyup', this.keyupProxy = (event) => { this.onKeyup(event) })
		document.getElementsByTagName('body')[0].addEventListener('click', this.bodyClickProxy = () => { this.lostFocus() });
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
		//top = top + this.editor.getElement().offsetTop;
		//left = left + this.editor.getElement().offsetLeft;

		// also add the actual area of the inner
		// tinymce area to our position
		//top = top + this.editor.getContentAreaContainer().offsetTop;
		//left = left + this.editor.getContentAreaContainer().offsetLeft;

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
	 * @return void
	 */
	clean(rollback = false)
	{
		this.unbindEvents()

		// clear the dropdown
		const dropdown = document.getElementById('tiny-tags-'+this.id)
		if(dropdown !== null)
		{
			this.editor.iframeElement.parentElement.removeChild(dropdown)
		}

		const container = this.editor.getDoc().getElementById('tiny-tags-search-'+this.id)
		if(container)
		{
			let replacement

			if(rollback)
			{
				replacement = document.createTextNode(this.delimeter + this.tracking)
			} else
			{
				replacement = document.createTextNode(this.delimeter)
			}

			this.editor.dom.replace(replacement, container)
			this.editor.selection.select(replacement)
			this.editor.selection.collapse()
		}
	}

	/**
	 * The default insert for a tag.
	 *
	 * @param
	 * @param
	 * @return string
	 */
	defaultInsert(item)
	{
		return '<span data-tagging-id="' + item[this.selector] + '">' + item[this.title] + '</span>';
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
	 * Get the current active item.
	 *
	 * @return
	 */
	getActiveItem()
	{
		const container = document.getElementById('tiny-tags-'+this.id)
		return container.querySelector('li.tiny-tags-item-active')
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
	 * Insert the item into the editor.
	 *
	 * @param object item
	 * @return void
	 */
	insertItem(item)
	{
		const container = this.editor.dom.select('span#tiny-tags-search-'+this.id)[0]
		this.editor.dom.remove(container)
		this.editor.execCommand('mceInsertContent', false, this.insert(item))
		//const container = this.editor.getDoc().getElementById('tiny-tags-search-'+this.id)
	}

	/**
	 * Lookup the keypress.
	 *
	 * @return void
	 */
	lookup()
	{
		this.tracking = (this.editor.getDoc().getElementById('tiny-tags-search-'+this.id).querySelector('span.tiny-tags-text').innerText).replace('\ufeff', '')

		// set the loading message
		this.displayContainerMessage(this.loadingMessage)

		clearTimeout(this.searching)
		this.searching = setTimeout(() =>
		{
			this.source(this.tracking, this.render.bind(this))
		}, this.delay)
	}

	/**
	 * Lost focus on tinymce, so clean.
	 *
	 * @return void
	 */
	lostFocus()
	{
		this.clean(true)
	}

	/**
	 * Do something as the tag is typed out.
	 *
	 * @param object e
	 * @return
	 */
	onKeydown(e)
	{
		switch(e.keyCode)
		{
			// ENTER
			case 13:
			// ESC
			case 27:
				e.preventDefault()
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
		}
		e.stopPropagation()
	}

	/**
	 * Do something as the tag is typed out.
	 *
	 * @param object e
	 * @return
	 */
	onKeyup(e)
	{
		switch(e.keyCode)
		{
			// SHIFT
			case 16:
			// CTRL
			case 17:
			// ALT
			case 18:
			// UP ARROW
			case 38:
			// DOWN ARROW
			case 40:
				e.preventDefault()
				break

			// BACKSPACE
			case 8:
				if(this.tracking === '')
				{
					this.clean()
				} else
				{
					this.lookup()
				}
				break

			// TAB
			case 9:
			// ENTER
			case 13:
				const active = this.getActiveItem()
				if(active)
				{
					this.selectActiveItem()
					this.clean()
				} else
				{
					this.clean(true)
				}
				break

			// ESC
			case 27:
				this.clean(true)
				break;

			// ANY OTHER
			default:
				this.lookup()
		}
	}

	/**
	 * Render the dropdown of the items.
	 *
	 * @param object tag
	 * @param array items
	 * @return void
	 */
	render(items)
	{
		// fetch the container
		const container = document.getElementById('tiny-tags-'+this.id)

		// are there any items?
		if(items.length !== 0)
		{
			// build the dropdown
			let ul = document.createElement('ul')
			ul.setAttribute('class', 'tiny-tags-list')
			for(let i = 0; i < this.limit; i++)
			{
				if(items[i])
				{
					const li = document.createElement('li')
					li.setAttribute('class', 'tiny-tags-item')
					li.setAttribute('data-tagging-id', items[i][this.selector])
					li.innerHTML = items[i][this.title]
					li.addEventListener('click', () =>
					{
						this.insertItem(items[i])
					})
					ul.append(li)
				}
			}
			container.innerHTML = ''
			container.appendChild(ul)
		} else
		{
			this.displayContainerMessage(this.emptyMessage)
		}

		this.items = items
	}

	/**
	 * Render the container within the editor.
	 *
	 * @return void
	 */
	renderContainer()
	{
		// build the container
		let rawContainer = '<span class="tiny-tags-search" id="tiny-tags-search-'+this.id+'">'
		rawContainer += '<span class="tiny-tags-delimeter">'
		rawContainer += this.delimeter
		rawContainer += '</span>'
		rawContainer += '<span class="tiny-tags-text">'
		rawContainer += '<span class="dummy">\ufeff</span>'
		rawContainer += '</span>'

		this.editor.execCommand('mceInsertContent', false, rawContainer)
		this.editor.focus()
		this.editor.selection.select(this.editor.selection.dom.select('span.tiny-tags-text span')[0])
		this.editor.selection.collapse(0)
	}

	/**
	 * Render the dropdown.
	 *
	 * @return void
	 */
	renderDropdown()
	{
		// fetch the editor and set the containing
		// to relative position
		const editor = this.editor.iframeElement
		editor.parentElement.style.position = 'relative'

		// build the container
		const position = this.calculatePosition()
		let container = document.createElement('div')
		container.setAttribute('class', 'tiny-tags-dropdown')
		container.setAttribute('id', 'tiny-tags-'+this.id)
		container.style.top = position.top + 'px'
		container.style.left = position.left + 'px'

		// append the container to the editor's parent
		editor.parentElement.appendChild(container)
	}

	/**
	 * Select the currently active item.
	 *
	 * @param object tag
	 * @return
	 */
	selectActiveItem()
	{
		// try to fetch the currently active list item
		const active = this.getActiveItem()

		if(active)
		{
			// fetch the tag from the tag list
			const item = this.items[this.items.findIndex((item) => 
				{
					return item[this.selector] === active.getAttribute('data-tagging-id')
				}
			)]

			this.insertItem(item)
		}
	}

	/**
	 * Unbind the events.
	 *
	 * @return void
	 */
	unbindEvents()
	{
		this.editor.off('keydown', this.keydownProxy)
		this.editor.off('keyup', this.keyupProxy)
		document.getElementsByTagName('body')[0].removeEventListener('click', this.bodyClickProxy);
	}
}

tinymce.create('tinymce.plugins.tag',
{
	init: (editor) =>
	{
		let tagging

		function prevCharIsSpace()
		{
			const start = editor.selection.getRng(true).startOffset
			const text = editor.selection.getRng(true).startContainer.data || ''
			const character = text.substr(start > 0 ? start - 1 : 0, 1).replace(/\s/g, '')

			return character == '' ? true : false
		}

		editor.on('keypress', (e) =>
		{
			const tracking = editor.getParam('tagging').filter((tag) =>
			{
				return tag.delimeter === String.fromCharCode(e.keyCode)
			})[0]

			if(typeof tracking !== 'undefined' && prevCharIsSpace())
			{
				e.preventDefault()
				tagging = new Tagging(
					editor,
					tracking,
				)
			}
		})
	}
});

tinymce.PluginManager.add('tag', tinymce.plugins.tag);