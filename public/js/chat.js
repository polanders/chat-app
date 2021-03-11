const socket = io();

// elements
$sidebar = document.querySelector('#sidebar');
$messageForm = document.querySelector('#message-form');
$messageFormInput = document.querySelector('#message-field');
$messageFormButton = document.querySelector('#submit');
$sendLocationButton = document.querySelector('#send-location');
$messages = document.querySelector('#messages');

// templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationTemplate = document.querySelector('#location-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

// options
const {
  username,
  room
} = Qs.parse(location.search, { ignoreQueryPrefix: true});

const autoscroll = () => {
  // new message element
  const $newMessage = $messages.lastElementChild;

  // height of new message
  const newMessageStyles = getComputedStyle($newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

  // visible height
  const visibleHeight = $messages.offsetHeight;

  // height of messages container
  const containerHeight = $messages.scrollHeight;

  // how far have I scrolled
  const scrollOffset = $messages.scrollTop + visibleHeight;

  if (containerHeight - newMessageHeight <= scrollOffset) {
    $messages.scrollTop = $messages.scrollHeight;
  }
};

socket.on('message', message => {
  const { username, text, createdAt} = message;
  const html = Mustache.render(messageTemplate, {
    username,
    text,
    createdAt: moment(createdAt).format('h:mm a'),
  });
  $messages.insertAdjacentHTML('beforeend', html);
  autoscroll();
});

socket.on('locationMessage', message => {
  const { username, url, createdAt } = message;
  const html = Mustache.render(locationTemplate, {
    username,
    url,
    createdAt: moment(createdAt).format('h:mm a'),
  });
  $messages.insertAdjacentHTML('beforeend', html);
  autoscroll();
});

socket.on('roomData', (data) => {
  const html = Mustache.render(sidebarTemplate, data);
  $sidebar.innerHTML = html;
});

$messageForm.addEventListener('submit', e => {
  e.preventDefault();

  $messageFormButton.setAttribute('disabled', 'disabled');

  const message = $messageFormInput.value;
  socket.emit('sendMessage', message, (error) => {
    $messageFormButton.removeAttribute('disabled');
    $messageFormInput.value = '';
    $messageFormInput.focus();

    if (error) {
      return console.log(error);
    }
    console.log('Message delivered');
  });
});

$sendLocationButton.addEventListener('click', e => {

  $sendLocationButton.setAttribute('disabled', 'disabled');

  const { geolocation } = navigator;
  if (!geolocation) {
    return alert('Geolocation is not supported by your browser.');
  }

  geolocation.getCurrentPosition(position => {
    const { latitude, longitude } = position.coords;
    socket.emit('sendLocation', {
      latitude,
      longitude,
    },
    (error) => {
      $sendLocationButton.removeAttribute('disabled');
      if (error) {
        return console.log(error);
      }
      console.log('Location shared!');
    });
  });
});

socket.emit('join', { username, room }, (error) => {
  if (error) {
    alert(error);
    location.href= '/';
  }
});
