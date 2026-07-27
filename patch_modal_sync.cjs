const fs = require('fs');
const file = 'src/components/OnlineMultiplayerLobby.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `  const [customName, setCustomName] = useState(playerProfile.name);
  const [customCountry, setCustomCountry] = useState(playerProfile.country);`;

const replace = `  const [customName, setCustomName] = useState(playerProfile.name);
  const [customCountry, setCustomCountry] = useState(playerProfile.country);

  useEffect(() => {
    if (showProfileModal) {
      setCustomName(playerProfile.name);
      setCustomCountry(playerProfile.country);
    }
  }, [showProfileModal, playerProfile]);`;

content = content.replace(target, replace);
fs.writeFileSync(file, content);
