import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  doc,
  deleteDoc,
  setDoc,
} from "firebase/firestore";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

const PRIORITIES = ["High", "Medium", "Low"];

export default function Dashboard() {
  const [lists, setLists] = useState([]);
  const [tasksMap, setTasksMap] = useState({});
  const [newList, setNewList] = useState("");
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) setUser(firebaseUser);
      else {
        setUser(null);
        navigate("/");
      }
    });
    return () => unsubscribeAuth();
  }, [navigate]);

  useEffect(() => {
    if (!user) return;
    const listsQuery = query(collection(db, "users", user.uid, "todoLists"));
    const unsubscribeLists = onSnapshot(listsQuery, (snapshot) => {
      const fetchedLists = [];
      snapshot.forEach((docSnap) => {
        fetchedLists.push({ id: docSnap.id, ...docSnap.data() });
      });
      setLists(fetchedLists);

      fetchedLists.forEach((list) => {
        const taskQuery = query(
          collection(db, "users", user.uid, "todoLists", list.id, "tasks")
        );
        onSnapshot(taskQuery, (taskSnapshot) => {
          const tasks = [];
          taskSnapshot.forEach((taskDoc) =>
            tasks.push({ id: taskDoc.id, ...taskDoc.data() })
          );
          setTasksMap((prev) => ({ ...prev, [list.id]: tasks }));
        });
      });
    });
    return () => unsubscribeLists();
  }, [user]);

  const addList = async (e) => {
    e.preventDefault();
    if (!newList.trim() || !user) return;
    await addDoc(collection(db, "users", user.uid, "todoLists"), {
      name: newList,
      createdAt: new Date(),
    });
    setNewList("");
  };

  const addTask = async (listId, task) => {
    if (!user) return;
    await addDoc(
      collection(db, "users", user.uid, "todoLists", listId, "tasks"),
      {
        ...task,
        priority: "Low",
        index: tasksMap[listId]?.length ?? 0,
        completed: false,
        createdAt: new Date(),
      }
    );
  };

  const deleteTask = async (listId, taskId) => {
    if (!user) return;
    await deleteDoc(
      doc(db, "users", user.uid, "todoLists", listId, "tasks", taskId)
    );
  };

  const toggleComplete = async (listId, taskId, current) => {
    if (!user) return;
    await setDoc(
      doc(db, "users", user.uid, "todoLists", listId, "tasks", taskId),
      { completed: !current },
      { merge: true }
    );
  };

  // Upar buttons par drop karte hi task ki priority update ho jaaye
  const handleDragEnd = async (result) => {
    if (!user) return;
    const { draggableId, source, destination } = result;
    if (!destination) return;

    const toPriority = destination.droppableId;
    if (PRIORITIES.includes(toPriority)) {
      for (let list of lists) {
        const taskArr = tasksMap[list.id] || [];
        const idx = taskArr.findIndex((t) => t.id === draggableId);
        if (idx > -1) {
          await setDoc(
            doc(
              db,
              "users",
              user.uid,
              "todoLists",
              list.id,
              "tasks",
              draggableId
            ),
            { priority: toPriority },
            { merge: true }
          );
          break;
        }
      }
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <span className="dashboard-title">My ToDo Dashboard</span>
        <button
          onClick={handleLogout}
          className="dashboard-logout btn btn-danger"
        >
          Logout
        </button>
      </div>
      <form onSubmit={addList} className="dashboard-form">
        <input
          type="text"
          placeholder="Enter new list name"
          className="input"
          value={newList}
          onChange={(e) => setNewList(e.target.value)}
        />
        <button className="btn btn-primary">Create List</button>
      </form>

      {/* Priority Drop Zones */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div
          style={{
            display: "flex",
            gap: 18,
            margin: "16px 0",
            justifyContent: "center",
          }}
        >
          {PRIORITIES.map((priority) => (
            <Droppable droppableId={priority} key={priority}>
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  style={{
                    border: `2px solid ${
                      priority === "High"
                        ? "#e2474b"
                        : priority === "Medium"
                        ? "#ff9c00"
                        : "#159a33"
                    }`,
                    minWidth: 240,
                    minHeight: 70,
                    borderRadius: 12,
                    background: "#fff",
                    alignItems: "center",
                    textAlign: "center",
                    padding: "10px 0",
                  }}
                >
                  <div
                    style={{
                      fontWeight: 700,
                      color:
                        priority === "High"
                          ? "#e2474b"
                          : priority === "Medium"
                          ? "#ff9c00"
                          : "#159a33",
                      fontSize: "1.27rem",
                    }}
                  >
                    {priority} Priority
                  </div>
                  <div
                    style={{
                      fontSize: "0.96rem",
                      color: "#555",
                      fontWeight: 400,
                    }}
                  >
                    Drop here to change
                  </div>
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          ))}
        </div>
        {/* Lists */}
        <div className="dashboard-grid">
          {lists.map((list) => (
            <Droppable droppableId={list.id} key={list.id}>
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="todo-list"
                  style={{
                    margin: "0 7px 15px 7px",
                    minWidth: 300,
                    maxWidth: 400,
                    background: "#f8f8fc",
                  }}
                >
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <h2 className="todo-list-title">{list.name}</h2>
                  </div>
                  <AddTaskForm listId={list.id} addTask={addTask} />
                  {(tasksMap[list.id] || []).map((task, idx) => (
                    <Draggable key={task.id} draggableId={task.id} index={idx}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`todo-task${
                            task.completed ? " completed" : ""
                          }`}
                          style={{
                            ...provided.draggableProps.style,
                            background: "#fff",
                            borderRadius: 8,
                            boxShadow: "0 1px 6px #0001",
                            padding: "9px 8px",
                            marginBottom: 8,
                          }}
                        >
                          <div style={{ fontWeight: 600 }}>{task.title}</div>
                          <div style={{ fontSize: "0.96rem", color: "#555" }}>
                            {task.description}
                          </div>
                          <div style={{ fontSize: "0.88rem", color: "#888" }}>
                            Due: {task.dueDate || "No date"}
                            <br />
                            Priority:{" "}
                            <span
                              style={{
                                color:
                                  task.priority === "High"
                                    ? "#e2474b"
                                    : task.priority === "Medium"
                                    ? "#ff9c00"
                                    : "#159a33",
                                fontWeight: 600,
                              }}
                            >
                              {task.priority}
                            </span>
                          </div>
                          <div className="flex gap-2" style={{ marginTop: 5 }}>
                            <button
                              className="btn btn-primary text-sm"
                              style={{
                                fontSize: "0.87rem",
                                padding: "2px 9px",
                              }}
                              onClick={() =>
                                toggleComplete(list.id, task.id, task.completed)
                              }
                            >
                              {task.completed ? "Undo" : "Done"}
                            </button>
                            <button
                              className="btn btn-danger text-sm"
                              style={{
                                fontSize: "0.83rem",
                                padding: "2px 9px",
                              }}
                              onClick={() => deleteTask(list.id, task.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}

function AddTaskForm({ listId, addTask }) {
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskDate, setTaskDate] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    await addTask(listId, {
      title: taskTitle,
      description: taskDesc,
      dueDate: taskDate,
    });
    setTaskTitle("");
    setTaskDesc("");
    setTaskDate("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-2 mb-2"
      style={{ marginBottom: 7 }}
    >
      <input
        type="text"
        placeholder="Task title"
        className="input"
        style={{ fontSize: "1rem", minHeight: 32 }}
        value={taskTitle}
        onChange={(e) => setTaskTitle(e.target.value)}
      />
      <input
        type="text"
        placeholder="Description"
        className="input"
        style={{ fontSize: "0.93rem", minHeight: 26 }}
        value={taskDesc}
        onChange={(e) => setTaskDesc(e.target.value)}
      />
      <input
        type="date"
        className="input"
        style={{ fontSize: "0.93rem", minWidth: 0, padding: "5px" }}
        value={taskDate}
        onChange={(e) => setTaskDate(e.target.value)}
      />
      <button
        className="btn btn-success"
        style={{ padding: "7px", width: 98, fontSize: "0.93rem" }}
      >
        Add Task
      </button>
    </form>
  );
}
