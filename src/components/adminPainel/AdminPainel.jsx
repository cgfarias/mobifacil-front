import { useState } from "react";
import { Trash2, MoveHorizontal } from "lucide-react";

const defaultUsers = [
  { id: 1, name: "Pedro Barbosa", photo: "https://i.pravatar.cc/150?img=1", group: "Carro 1" },
  { id: 2, name: "Felipe Alves Coreia Guizzi", photo: "https://i.pravatar.cc/150?img=2", group: "Carro 1" },
  { id: 3, name: "Pedro Jorge do Nascimento Gomes", photo: null, group: "Carro 1" },
  { id: 4, name: "Diego Aragão", photo: "https://i.pravatar.cc/150?img=3", group: "Carro 2" },
  { id: 5, name: "Yuri Ferreira", photo: null, group: "Carro 2" },
];

const AdminPanel = () => {
  const [users, setUsers] = useState(defaultUsers);
  const [search, setSearch] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("Carro 1");

  const isGroupFull = (group) => users.filter(u => u.group === group).length >= 4;

  const handleDelete = (id) => {
    setUsers(users.filter(user => user.id !== id));
  };

  const handleMove = (id) => {
    const user = users.find(u => u.id === id);
    const targetGroup = user.group === "Carro 1" ? "Carro 2" : "Carro 1";

    if (isGroupFull(targetGroup)) return alert(`O ${targetGroup} já está cheio!`);

    setUsers(prev =>
      prev.map(user =>
        user.id === id ? { ...user, group: targetGroup } : user
      )
    );
  };

  const handleAdd = () => {
    if (!newUserName.trim()) return;
    if (isGroupFull(selectedGroup)) return alert(`O ${selectedGroup} já está cheio!`);

    const newId = Math.max(...users.map(u => u.id)) + 1;
    setUsers([...users, { id: newId, name: newUserName, photo: null, group: selectedGroup }]);
    setNewUserName("");
  };

  const filteredUsers = (group) =>
    users
      .filter(u => u.group === group && u.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name));

  const renderUser = (user) => (
    <div
      key={user.id}
      className="flex justify-between items-center bg-slate-900 text-slate-200 px-4 py-3 rounded-lg mb-2"
    >
      <div className="flex items-center gap-3">
        {user.photo ? (
          <img src={user.photo} className="w-8 h-8 rounded-full" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-orange-300 text-white font-bold flex items-center justify-center">👤</div>
        )}
        <span className="text-sm">{user.name}</span>
      </div>
      <div className="flex items-center gap-2">
        {!isGroupFull(user.group === "Carro 1" ? "Carro 2" : "Carro 1") ? (
          <button onClick={() => handleMove(user.id)} className="text-blue-400 hover:text-blue-300">
            <MoveHorizontal size={16} />
          </button>
        ) : (
          <span className="text-gray-600" title="Carro cheio">
            <MoveHorizontal size={16} />
          </span>
        )}
        <button onClick={() => handleDelete(user.id)} className="text-red-500 hover:text-red-400">
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="bg-slate-800 p-10 text-slate-200 w-full rounded-lg">
      <div className="flex gap-6">
        {["Carro 1", "Carro 2"].map(group => (
          <div key={group} className="w-1/2 bg-slate-700 rounded-lg shadow-md">
            <div className={`px-4 py-3 text-lg font-bold text-white ${group === "Carro 1" ? "bg-blue-400" : "bg-blue-400"} rounded-t-lg`}>
              {group}
            </div>
            <div className="p-4">
              {filteredUsers(group).map(renderUser)}
              <div className="mt-2 text-xs text-slate-400">
                {users.filter(u => u.group === group).length} / 4 ocupando este carro
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Barra inferior */}
      <div className="flex justify-between items-center mt-6">
        <input
          type="text"
          placeholder="Buscar por nome..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-slate-700 border border-slate-600 text-slate-200 rounded px-4 py-2 w-1/3 placeholder-slate-400"
        />

        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Novo nome"
            value={newUserName}
            onChange={(e) => setNewUserName(e.target.value)}
            className="bg-slate-700 border border-slate-600 text-slate-200 rounded px-4 py-2 placeholder-slate-400"
          />
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="bg-slate-700 border border-slate-600 text-slate-200 rounded px-2 py-2"
          >
            <option value="Carro 1">Carro 1</option>
            <option value="Carro 2">Carro 2</option>
          </select>
          <button
            onClick={handleAdd}
            disabled={isGroupFull(selectedGroup)}
            className={`px-4 py-2 rounded ${
              isGroupFull(selectedGroup)
                ? "bg-gray-500 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            } text-white`}
          >
            Adicionar
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
