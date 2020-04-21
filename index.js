document.addEventListener("DOMContentLoaded", () => {
  const url = new URL(document.URL);
  const apiKey = url.searchParams.get("api_key");
  const apiSecret = url.searchParams.get("api_secret");

  if (url.searchParams.get("meeting_number")) {
    document.getElementById("meeting_number").value = url.searchParams.get("meeting_number");
  }

  ZoomMtg.preLoadWasm();
  ZoomMtg.prepareJssdk();

  document.getElementById("join_meeting").addEventListener("click", e => {
    e.preventDefault();

    if(!apiKey || !apiSecret){
      alert("No api key or api secret");
      return false;
    }

    if(!document.getElementById("meeting_form").checkValidity()){
      alert("Enter Name and Meeting Number");
      return false;
    }

    _connect(apiKey, apiSecret);
  });
});

function _connect(apiKey, apiSecret) {
  const meetingNumber = parseInt(document.getElementById("meeting_number").value);
  const passWord = document.getElementById("meeting_password").value;
  const userName = document.getElementById("user_name").value;
  const role = parseInt(document.getElementById("meeting_role").value, 10);
  const leaveUrl = ".";

  const signature = ZoomMtg.generateSignature({
    apiKey,
    apiSecret,
    meetingNumber,
    role,
    error: _onError,
    success: res => {
      console.log(res.result);
    },
  });

  ZoomMtg.init({
    leaveUrl,
    isSupportAV: true,
    error: _onError,
    success: () => {
      ZoomMtg.join({
        apiKey,
        signature,
        meetingNumber,
        userName,
        passWord,
        error: _onError,
        success: res => {
          document.getElementById("nav-tool").style.display = "none";
          console.log("join meeting success");
          _startPointService(userName);
        },
      });
    },
  });
}

function _startPointService(user) {
  const host = window.location.origin.replace(/^http/, "ws")
  const ws = new WebSocket(host);
  ws.onmessage = event => {
    const message = JSON.parse(event.data);
    _point(message);
  };

  window.addEventListener("click", ({ clientX, clientY }) => {
    const { innerWidth, innerHeight } = window;
    const x = clientX / innerWidth;
    const y = clientY / innerHeight;
    ws.send(JSON.stringify({ user, x, y }));
  });
}

function _point({ user, x, y }) {
  const id = `user-${user}`;

  let point = document.getElementById(id);

  if (!point) {
    point = document.createElement("mark");
    point.id = id;
    point.classList.add("point");

    const layer = document.getElementById("points-layer");
    layer.appendChild(point);
  }

  point.style.left = `${ x * 100 }%`;
  point.style.top = `${ y * 100 }%`;
}

function _onError(res) {
  console.error(res);
}
