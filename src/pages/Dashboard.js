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
  writeBatch,
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
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) setUser(firebaseUser);
      else {
        setUser(null);
        navigate("/");
      }
    });
    return unsubscribe;
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
        const tasksQuery = query(
          collection(db, "users", user.uid, "todoLists", list.id, "tasks")
        );
        onSnapshot(tasksQuery, (tasksSnapshot) => {
          const tasksArr = [];
          tasksSnapshot.forEach((taskDoc) => {
            tasksArr.push({ id: taskDoc.id, ...taskDoc.data() });
          });
          setTasksMap((prev) => ({ ...prev, [list.id]: tasksArr }));
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

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  const handleDragEnd = async (result) => {
    if (!user) return;
    const { source, destination, draggableId } = result;

    if (!destination) return;

    if (PRIORITIES.includes(destination.droppableId)) {
      for (const list of lists) {
        const taskIndex = tasksMap[list.id]?.findIndex(
          (t) => t.id === draggableId
        );
        if (taskIndex !== -1) {
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
            { priority: destination.droppableId },
            { merge: true }
          );
          break;
        }
      }
      return;
    }

    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const sourceTasks = tasksMap[source.droppableId] || [];
    const movedTask = sourceTasks.find((t) => t.id === draggableId);
    if (!movedTask) return;

    const batch = writeBatch(db);

    const sourceDocRef = doc(
      db,
      "users",
      user.uid,
      "todoLists",
      source.droppableId,
      "tasks",
      draggableId
    );
    batch.delete(sourceDocRef);

    const destDocRef = doc(
      collection(
        db,
        "users",
        user.uid,
        "todoLists",
        destination.droppableId,
        "tasks"
      )
    );
    batch.set(destDocRef, { ...movedTask, index: destination.index });

    await batch.commit();
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
        <button className="btn btn-primary">Create</button>
      </form>

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
                  {...provided.droppableProps}
                  ref={provided.innerRef}
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
                  <div style={{ fontSize: "0.96rem", color: "#555" }}>
                    Drop here to change
                  </div>
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          ))}
        </div>

        <div className="dashboard-grid">
          {lists.map((list) => (
            <Droppable droppableId={list.id} key={list.id}>
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="todo-list"
                  style={{
                    margin: "0 7px 15px",
                    background: "#f8f8fc",
                    borderRadius: 12,
                    padding: 12,
                  }}
                >
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: "1.1rem",
                      marginBottom: 8,
                    }}
                  >
                    {list.name}
                  </div>
                  <AddTaskForm listId={list.id} addTask={addTask} />

                  {(tasksMap[list.id] || []).map((task, index) => (
                    <Draggable
                      draggableId={task.id}
                      index={index}
                      key={task.id}
                    >
                      {(provided) => (
                        <div
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          ref={provided.innerRef}
                          className={`todo-task${
                            task.completed ? " completed" : ""
                          }`}
                          style={{
                            ...provided.draggableProps.style,
                            background: "#fff",
                            borderRadius: 8,
                            padding: 10,
                            marginBottom: 10,
                            boxShadow: "0 1px 6px rgb(0 0 0 / 0.15)",
                            cursor: "grab",
                            userSelect: "none",
                          }}
                        >
                          <div
                            style={{ fontWeight: 600, wordBreak: "break-word" }}
                          >
                            {task.title}
                          </div>
                          <div
                            style={{
                              fontSize: 14,
                              color: "#666",
                              marginBottom: 8,
                            }}
                          >
                            {task.description}
                          </div>
                          <div style={{ fontSize: 12, color: "#999" }}>
                            Due: {task.dueDate || "No date"}
                            <br />
                            Priority:{" "}
                            <span
                              style={{
                                fontWeight: "bold",
                                color:
                                  task.priority === "High"
                                    ? "#e2474b"
                                    : task.priority === "Medium"
                                    ? "#ff9c00"
                                    : "#159a33",
                              }}
                            >
                              {task.priority}
                            </span>
                          </div>
                          <div
                            style={{ marginTop: 10, display: "flex", gap: 6 }}
                          >
                            <button
                              onClick={() =>
                                toggleComplete(list.id, task.id, task.completed)
                              }
                              className="btn btn-primary btn-sm"
                            >
                              {task.completed ? "Undo" : "Done"}
                            </button>
                            <button
                              onClick={() => deleteTask(list.id, task.id)}
                              className="btn btn-danger btn-sm"
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
    await addTask({
      title: taskTitle,
      description: taskDesc,
      dueDate: taskDate,
      listId,
    });
    setTaskTitle("");
    setTaskDesc("");
    setTaskDate("");
  };

  return (
    <form onSubmit={handleSubmit} className="form-main">
      <input
        type="text"
        className="input"
        placeholder="Task title"
        value={taskTitle}
        onChange={(e) => setTaskTitle(e.target.value)}
      />
      <input
        type="text"
        className="input"
        placeholder="Description"
        value={taskDesc}
        onChange={(e) => setTaskDesc(e.target.value)}
      />
      <input
        type="date"
        className="input"
        value={taskDate}
        onChange={(e) => setTaskDate(e.target.value)}
      />
      <button
        type="submit"
        className="btn btn-success"
        style={{ marginTop: 8, width: 100 }}
      >
        Add Task
      </button>
    </form>
  );
}
