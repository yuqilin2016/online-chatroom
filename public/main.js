$(function(){
  let FADE_TIME = 150
  let TYPING_TIMER_LENGTH = 400
  let COLORS = [
    '#e21400', '#91580f', '#f8a700', '#f78b00',
    '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
    '#3b88eb', '#3824aa', '#a700ff', '#d300e7'
  ]

	let $usernameInput = $('.usernameInput')
	let $loginPage = $('.login.page')
	let $chatPage = $('.chat.page')
	let $messages = $('.messages')
	let $inputMessage = $('.inputMessage')
	let $currentInput = $usernameInput.focus()
  let lastTypingTime

	let $window = $(window)

	let username
  let connected = false
  let typing = false

	let socket = io.connect('http://192.168.199.131:3000')

	const cleanInput = (input) => {
    return $('<div/>').text(input).html();
  }

  const setUsername = () => {
  	username = cleanInput($usernameInput.val().trim())
  	if (username) {
  		console.log(username)
  		$loginPage.fadeOut()
  		$chatPage.show()
  		$loginPage.off('click')
  		$currentInput = $inputMessage.focus()
  		socket.emit('add user', username)
  	}
  }

  const sendMessage = () => {
  	let message = $inputMessage.val()
  	message = cleanInput(message)
  	if (message && connected) {
  		$inputMessage.val('')
  		addChatMessage({
  		  username: username,
  		  message: message
  		})
  	}
  	socket.emit('new message', message)
  }

  const addChatMessage = (data, options) => {
    let $typingMessages = getTypingMessages(data)
    options = options || {}
    if ($typingMessages.length !== 0) {
      options.fade = false;
      $typingMessages.remove();
    }

  	let $usernameDiv = $('<span class="username"/>')
  	.text(data.username)
    .css('color', getUsernameColor(data.username))

  	let $messageBodyDiv = $('<span class="messageBody">')
  	.text(data.message)

    let typingClass = data.typing ? 'typing' : ''
  	let $messageDiv = $('<li class="message"/>')
  	.data('username', data.username)
    .addClass(typingClass)
  	.append($usernameDiv, $messageBodyDiv)

  	addMessageElement($messageDiv, options)
  }

  const addMessageElement = (el, options) => {
  	let $el = $(el)
    if (!options) {
      options = {}
    }
    if (typeof options.fade === 'undefined') {
      options.fade = true
    }
    if (typeof options.prepend === 'undefined') {
      options.prepend = false
    }
    if (options.fade) {
      $el.hide().fadeIn(FADE_TIME);
    }
    if (options.prepend) {
      $messages.prepend($el);
    } else {
      $messages.append($el);
    }
    $messages[0].scrollTop = $messages[0].scrollHeight
  }

  const log = (message, options) => {
    let $el = $('<li>').addClass('log').text(message)
    addMessageElement($el, options)
  }

  const addParticipantsMessage = (data) => {
    let message = `现在聊天室有${data.numUsers}人`
    log(message)
  }

  const getUsernameColor = (username) => {
    // Compute hash code
    var hash = 7;
    for (var i = 0; i < username.length; i++) {
       hash = username.charCodeAt(i) + (hash << 5) - hash;
    }
    // Calculate color
    var index = Math.abs(hash % COLORS.length);
    return COLORS[index];
  }

  const addChatTyping = (data) => {
    data.typing = true
    data.message = '正在输入...'
    addChatMessage(data)
  }

  const updateTyping = () => {
    if (connected) {
      if (!typing) {
        typing = true
        socket.emit('typing')
      }
      lastTypingTime = (new Date()).getTime()

      setTimeout(() => {
        let typingTimer = (new Date()).getTime()
        let timeDiff = typingTimer - lastTypingTime
        if (timeDiff >= TYPING_TIMER_LENGTH && typing) {
          socket.emit('stop typing')
          typing = false
        }
      }, TYPING_TIMER_LENGTH)
    }
  }

  const getTypingMessages = (data) => {
    return $('.typing.message').filter(function (i) {
      return $(this).data('username') === data.username
    })
  }

  const removeChatTyping = (data) => {
    getTypingMessages(data).fadeOut(function () {
      $(this).remove()
    })
  }

  $inputMessage.on('input', () => {
    updateTyping()
  })

  $window.keydown((event) => {
  	if (event.which === 13) {
  		if (username) {
  			sendMessage()
  		} else {
  			setUsername()
  		}
  	}
  })

  $loginPage.click(() => {
    $currentInput.focus();
  })
  $inputMessage.click(() => {
    $inputMessage.focus();
  })

  socket.on('new message', (data) => {
  	addChatMessage(data)
  })

  socket.on('login', (data) => {
    connected = true
    let message = "欢迎来到本聊天室！"
    log(message, {
      prepend: true
    })
    addParticipantsMessage(data)
  })

  socket.on('user joined', (data) => {
    log(data.username + '加入了本聊天室')
    addParticipantsMessage(data)
  })

  socket.on('user left', (data) => {
    log(data.username + '离开了本聊天室')
    addParticipantsMessage(data)
    removeChatTyping(data)
  })

  socket.on('typing', (data) => { 
    addChatTyping(data)
  })

  socket.on('stop typing', (data) => {
    removeChatTyping(data);
  })

})