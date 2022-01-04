/**
 * @jest-environment jsdom
 */
import * as THREE from "three";
import { CenterCircleFactory } from "../src/commands/circle/CircleFactory";
import { ObjectPicker, ObjectPickerViewportSelector } from "../src/command/ObjectPicker";
import { Viewport } from "../src/components/viewport/Viewport";
import { Editor } from "../src/editor/Editor";
import { GeometryDatabase } from '../src/editor/GeometryDatabase';
import { ChangeSelectionExecutor, SelectionMode } from "../src/selection/ChangeSelectionExecutor";
import { SelectionDatabase, ToggleableSet } from "../src/selection/SelectionDatabase";
import * as visual from '../src/visual_model/VisualModel';
import { MakeViewport } from "../__mocks__/FakeViewport";
import './matchers';

let db: GeometryDatabase;
let changeSelection: ChangeSelectionExecutor;
let selection: SelectionDatabase;
let editor: Editor;
let viewport: Viewport;

beforeEach(() => {
    editor = new Editor();
    viewport = MakeViewport(editor);
    editor.viewports.push(viewport);

    db = editor._db;
    selection = editor._selection;
    changeSelection = editor.changeSelection;
})

let item: visual.SpaceInstance<visual.Curve3D>;
beforeEach(async () => {
    const makeCircle = new CenterCircleFactory(editor.db, editor.materials, editor.signals);
    makeCircle.center = new THREE.Vector3();
    makeCircle.radius = 1;
    item = await makeCircle.commit() as visual.SpaceInstance<visual.Curve3D>;
});

describe(ObjectPicker, () => {
    test('execute disabled & re-enables viewport controls', async () => {
        expect(viewport.multiplexer.enabled).toBe(true);
        expect(viewport.navigationControls.enabled).toBe(true);

        const objectPicker = new ObjectPicker(editor);
        const promise = objectPicker.execute(() => { });

        expect(viewport.multiplexer.enabled).toBe(false);
        expect(viewport.navigationControls.enabled).toBe(true);

        promise.finish();
        await promise;

        expect(viewport.multiplexer.enabled).toBe(true);
        expect(viewport.navigationControls.enabled).toBe(true);
    })

    test('adds and removes event listeners', async () => {
        const objectPicker = new ObjectPicker(editor);

        const addEventListener = jest.spyOn(viewport.renderer.domElement, 'addEventListener');
        const promise = objectPicker.execute(() => { });
        expect(addEventListener).toBeCalledTimes(3);

        const removeEventListener = jest.spyOn(viewport.renderer.domElement, 'removeEventListener');
        promise.finish();
        expect(removeEventListener).toBeCalledTimes(3);
        await promise;
    })

    test('get, when enough already selected', async () => {
        editor.selection.selected.addCurve(item);
        const objectPicker = new ObjectPicker(editor);
        const result = await objectPicker.get(SelectionMode.Curve);
        expect(result).toEqual([item]);
    })

    test('allows for locally scoped signals', async () => {
        const temp = selection.makeTemporary();
        const objectPicker = new ObjectPicker(editor, temp);
        let privateCount = 0;
        let publicCount = 0;
        temp.signals.objectSelected.add(() => privateCount++);
        editor.signals.objectSelected.add(() => publicCount++);
        temp.selected.addCurve(item);
        expect(privateCount).toBe(1);
        expect(publicCount).toBe(0);
        expect(temp.selected.curves.size).toBe(1);
    })

    test('when an object is deleted, it is also removed from the selection', async () => {
        const temp = selection.makeTemporary();
        const objectPicker = new ObjectPicker(editor, temp);
        const promise = objectPicker.execute(() => { });
        temp.selected.addCurve(item);
        expect(temp.selected.curves.size).toBe(1);
        await db.removeItem(item);
        expect(temp.selected.curves.size).toBe(0);
        promise.finish();
        await promise;
    })

    test('when an object is deleted, no infinite loop when selection is global', async () => {
        const objectPicker = new ObjectPicker(editor, selection);
        const promise = objectPicker.execute(() => { });
        selection.selected.addCurve(item);
        expect(selection.selected.curves.size).toBe(1);
        await db.removeItem(item);
        expect(selection.selected.curves.size).toBe(0);
        promise.finish();
        await promise;
    })
});

describe(ObjectPickerViewportSelector, () => {
    let selector: ObjectPickerViewportSelector;
    let selection: SelectionDatabase;
    let onEmptyIntersection: jest.Mock<any, any>;

    beforeEach(() => {
        selection = new SelectionDatabase(db, editor.materials, editor.signals);
        onEmptyIntersection = jest.fn();
        selector = new ObjectPickerViewportSelector(viewport, editor, selection, onEmptyIntersection, {});
    });

    test('processClick empty', () => {
        expect(onEmptyIntersection).toBeCalledTimes(0);
        selector.processClick([], new MouseEvent('up'));
        expect(onEmptyIntersection).toBeCalledTimes(1);
    });

    test('processClick non-empty', () => {
        expect(selection.selected.curves.size).toBe(0);
        expect(onEmptyIntersection).toBeCalledTimes(0);
        selector.processClick([{ object: item.underlying, point: new THREE.Vector3() }], new MouseEvent('up'));
        expect(onEmptyIntersection).toBeCalledTimes(0);
        expect(selection.selected.curves.size).toBe(1);
    });
});