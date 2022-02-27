import React from "react";
import { shell } from "electron";

import Paper from "@mui/material/Paper";
import Grid from "@mui/material/Grid";
import Tooltip from "@mui/material/Tooltip";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import IconButton from "@mui/material/IconButton";

import { Demo } from "./Demo";
import { DemoHeader } from "./DemoHeader";
import DemoEvent from "./DemoEvent";
import EventTable from "./EventTable";
import DemoDetailsList from "./DemoDetailsList";
import FullscreenDialog from "./FullscreenDialog";
import EditEventDialog from "./EditEventDialog";
import EventTableEntry from "./EventTableEntry";
import DeleteDialog from "./DeleteDialog";
import RenameDialog from "./RenameDialog";
import MapThumbnail from "./MapThumbnail";

type DemoDetailsProps = {
  demo: Demo | null;
  onClose: () => void;
};

type DemoDetailsState = {
  open: boolean;
  demo: Demo | null;
  demoHeader: DemoHeader | null;
  events: EventTableEntry[];
  nextAvailableID: number;
  deleteDialogOpen: boolean;
};

export default class DemoDetails extends React.Component<
  DemoDetailsProps,
  DemoDetailsState
> {
  private editEventDialog: React.RefObject<EditEventDialog>;

  private renameDialog: React.RefObject<RenameDialog>;

  constructor(props: DemoDetailsProps) {
    super(props);
    this.state = {
      open: false,
      demo: props.demo,
      demoHeader: null,
      events: [],
      nextAvailableID: 0,
      deleteDialogOpen: false,
    };
    this.editEventDialog = React.createRef();
    this.renameDialog = React.createRef();
  }

  close = () => {
    const { onClose } = this.props;
    this.setState({ open: false });
    onClose();
  };

  viewDemo = (demo: Demo) => {
    this.setState({ demo, nextAvailableID: 0 });
    const { events, header } = demo;
    const entries: EventTableEntry[] = [];
    let i = 0;
    for (; i < events.length; i += 1) {
      entries.push({ id: i, event: events[i] });
    }
    this.setState({
      events: entries,
      demoHeader: header,
      open: true,
      nextAvailableID: i,
    });
  };

  writeEvents = () => {
    const { events, demo } = this.state;
    if (demo === null) {
      return;
    }
    const newEvents: DemoEvent[] = [];
    for (let i = 0; i < events.length; i += 1) {
      newEvents.push(events[i].event);
    }
    demo.writeEvents(newEvents);
  };

  editCallback = (event: EventTableEntry) => {
    const { events } = this.state;
    const index = events.findIndex((value: EventTableEntry) => {
      return value.id === event.id;
    });
    events[index] = event;
    this.setState({
      events,
    });
    this.writeEvents();
  };

  addCallback = (event: EventTableEntry) => {
    const { events, nextAvailableID } = this.state;
    event.id = nextAvailableID;
    events.push(event);
    this.setState({
      events,
      nextAvailableID: nextAvailableID + 1,
    });
    this.writeEvents();
  };

  deleteCallback = (event: EventTableEntry) => {
    const { events } = this.state;
    const index = events.findIndex((value: EventTableEntry) => {
      return value.id === event.id;
    });
    events.splice(index, 1);
    this.setState({
      events,
    });
    this.writeEvents();
  };

  editEvent = (event: EventTableEntry) => {
    this.editOrAddEvent(event, true);
  };

  addEvent = () => {
    this.editOrAddEvent(
      {
        id: -1,
        event: {
          tick: 0,
          name: "Bookmark",
          value: "New Bookmark",
        },
      },
      false
    );
  };

  editOrAddEvent = (event: EventTableEntry, edit: boolean) => {
    if (this.editEventDialog.current) {
      this.editEventDialog.current.setEvent(event);
      this.editEventDialog.current.setEditing(edit);
      this.editEventDialog.current.open();
    }
  };

  deleteDialogClose = () => {
    this.setState({ deleteDialogOpen: false });
  };

  deleteDialogConfirm = () => {
    const { demo } = this.state;
    demo?.delete();
    this.setState({
      deleteDialogOpen: false,
      demo: null,
    });
    this.close();
  };

  renameDialogOpen = () => {
    const { demo } = this.state;
    if (this.renameDialog.current !== null && demo !== null) {
      this.renameDialog.current.open(demo.getShortName());
    }
  };

  renameDialogClose = () => {
    if (this.renameDialog.current !== null) {
      this.renameDialog.current.close();
    }
  };

  renameDialogConfirm = (newName: string) => {
    const { demo } = this.state;
    demo?.rename(newName);
    this.setState({ demo });
    this.renameDialogClose();
  };

  render() {
    const { demo, demoHeader, open, events, deleteDialogOpen } = this.state;
    if (demo === null || demoHeader === null) {
      return null;
    }
    return (
      <>
        <FullscreenDialog
          title={demo.getShortName()}
          open={open}
          onClose={this.close}
        >
          <Grid
            item
            container
            alignItems="stretch"
            justifyContent="space-around"
            style={{ padding: "24px" }}
          >
            <Grid
              item
              container
              direction="column"
              xs={6}
              alignItems="center"
              spacing={2}
            >
              <Grid item>
                <MapThumbnail mapName={demoHeader.mapName} />
              </Grid>
              <Grid item>
                <DemoDetailsList demo={demo} demoHeader={demoHeader} />
              </Grid>
              <Grid item>
                <Tooltip title="Rename">
                  <IconButton onClick={this.renameDialogOpen}>
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton
                    onClick={() => {
                      this.setState({ deleteDialogOpen: true });
                    }}
                  >
                    <DeleteOutlineIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Show in explorer">
                  <IconButton
                    onClick={() => {
                      shell.showItemInFolder(demo.filename);
                    }}
                  >
                    <FolderOpenIcon />
                  </IconButton>
                </Tooltip>
              </Grid>
            </Grid>
            <Grid item xs={6}>
              <Paper elevation={3} style={{ padding: "5px" }}>
                <EventTable
                  data={events}
                  editEvent={this.editEvent}
                  addEvent={this.addEvent}
                />
              </Paper>
            </Grid>
          </Grid>
        </FullscreenDialog>
        <EditEventDialog
          ref={this.editEventDialog}
          addCallback={this.addCallback}
          editCallback={this.editCallback}
          deleteCallback={this.deleteCallback}
        />
        <DeleteDialog
          open={deleteDialogOpen}
          demoName={demo.getShortName()}
          onClose={this.deleteDialogClose}
          onConfirm={this.deleteDialogConfirm}
        />
        <RenameDialog
          ref={this.renameDialog}
          onClose={this.renameDialogClose}
          onConfirm={this.renameDialogConfirm}
          oldName={demo.getShortName()}
        />
      </>
    );
  }
}
