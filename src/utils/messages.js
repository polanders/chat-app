const generateMessage = (username, message) => {
  return {
    username,
    text: message,
    createdAt: new Date().getTime(),
  }
};

const generateLocationMessage = (username, coords) => {
  return {
    username,
    url: `https://google.com/maps/@${coords.latitude},${coords.longitude}`,
    createdAt: new Date().getTime(),
  }
};

module.exports = {
  generateMessage,
  generateLocationMessage,
};
