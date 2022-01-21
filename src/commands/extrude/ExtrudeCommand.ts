import * as THREE from "three";
import Command, { EditorLike } from "../../command/Command";
import { ObjectPicker } from "../../command/ObjectPicker";
import { SelectionMode } from "../../selection/ChangeSelectionExecutor";
import * as visual from "../../visual_model/VisualModel";
import { MultiBooleanFactory } from "../boolean/BooleanFactory";
import { PossiblyBooleanKeyboardGizmo } from "../boolean/BooleanKeyboardGizmo";
import { ExtrudeDialog } from "./ExtrudeDialog";
import { CurveExtrudeFactory, FaceExtrudeFactory, MultiExtrudeFactory, PossiblyBooleanExtrudeFactory, PossiblyBooleanFaceExtrudeFactory, RegionExtrudeFactory } from "./ExtrudeFactory";
import { ExtrudeGizmo } from "./ExtrudeGizmo";

const Y = new THREE.Vector3(0, 1, 0);

export class ExtrudeCommand extends Command {
    point?: THREE.Vector3;

    async execute(): Promise<void> {
        const { selection: { selected } } = this.editor;

        // @ts-ignore
        let extrude = ExtrudeFactory(this.editor).resource(this);

        const gizmo = new ExtrudeGizmo(extrude, this.editor);
        const keyboard = new PossiblyBooleanKeyboardGizmo("extrude", this.editor);
        const dialog = new ExtrudeDialog(extrude, this.editor.signals);

        keyboard.prepare(extrude).resource(this);

        gizmo.position.copy(this.point ?? extrude.center);
        gizmo.quaternion.setFromUnitVectors(Y, extrude.direction);

        gizmo.execute(async params => {
            await extrude.update();
            keyboard.toggle(extrude.isOverlapping);
            dialog.render();
        }).resource(this);

        dialog.execute(params => {
            extrude.update();
        }).resource(this).then(() => this.finish(), () => this.cancel());

        dialog.prompt("Select target bodies", () => {
            const objectPicker = new ObjectPicker(this.editor);
            objectPicker.selection.selected.add(extrude.targets);
            return objectPicker.execute(async delta => {
                const targets = [...objectPicker.selection.selected.solids];
                extrude.targets = targets;
                await extrude.update();
                keyboard.toggle(extrude.isOverlapping);
            }, 1, Number.MAX_SAFE_INTEGER, SelectionMode.Solid).resource(this)
        }, async () => {
            extrude.targets = [];
            await extrude.update();
            keyboard.toggle(extrude.isOverlapping);
        });

        await this.finished;

        const results = await extrude.commit() as visual.Solid[];
        selected.add(results);

        for (const face of selected.faces) { selected.removeFace(face) }
        for (const region of selected.regions) { selected.removeRegion(region) }
    }
}

function ExtrudeFactory(editor: EditorLike) {
    const { db, materials, signals, selection: { selected } } = editor;

    const factories = [];
    const targets = [...selected.solids];
    for (const region of selected.regions) {
        const bool = new MultiBooleanFactory(db, materials, signals);
        const phantom = new RegionExtrudeFactory(db, materials, signals);
        phantom.region = region;
        const possibly = new PossiblyBooleanExtrudeFactory(bool, phantom);
        factories.push(possibly);
    }
    for (const face of selected.faces) {
        const bool = new MultiBooleanFactory(db, materials, signals);
        const phantom = new FaceExtrudeFactory(db, materials, signals);
        phantom.face = face;
        const possibly = new PossiblyBooleanFaceExtrudeFactory(bool, phantom);
        possibly.face = face;
        factories.push(possibly);
    }
    if (selected.curves.size > 0) {
        const bool = new MultiBooleanFactory(db, materials, signals);
        const phantom = new CurveExtrudeFactory(db, materials, signals);
        phantom.curves = [...selected.curves];
        const possibly = new PossiblyBooleanExtrudeFactory(bool, phantom);
        factories.push(possibly);
    }
    const extrude = new MultiExtrudeFactory(factories);
    extrude.targets = targets;
    return extrude;
}
