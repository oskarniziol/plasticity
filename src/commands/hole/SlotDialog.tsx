import { render } from 'preact';
import { AbstractDialog } from "../../command/AbstractDialog";
import { EditorSignals } from '../../editor/EditorSignals';
import { SlotParams } from "./SlotFactory";
import c3d from '../../../build/Release/c3d.node';

export class SlotDialog extends AbstractDialog<SlotParams> {
    constructor(protected readonly params: SlotParams, signals: EditorSignals) {
        super(signals);
    }

    render() {
        const { width, depth, floorRadius, tailAngle, bottomWidth, bottomDepth, placeAngle, azimuthAngle, type } = this.params;

        render(
            <>
                <h4>Slot</h4>
                <ul>
                    <li>
                        <label for="type">Type
                        </label>

                        <input type="radio" name="type" id="rectangular" value={c3d.SlotType.Rectangular} checked={type === c3d.SlotType.Rectangular} onClick={this.onChange}></input>
                        <label class="btn" for="rectangular">Rectangular</label>

                        <input type="radio" name="type" id="ball-end" value={c3d.SlotType.BallEnd} checked={type === c3d.SlotType.BallEnd} onClick={this.onChange}></input>
                        <label class="btn" for="ball-end">Ball end</label>

                        <input type="radio" name="type" id="t-shaped" value={c3d.SlotType.TShaped} checked={type === c3d.SlotType.TShaped} onClick={this.onChange}></input>
                        <label class="btn" for="t-shaped">T-shaped</label>

                        {/* <input type="radio" name="type" id="dovetail" value={c3d.SlotType.DoveTail} checked={type === c3d.SlotType.DoveTail} onClick={this.onChange}></input>
                        <label class="btn" for="dovetail">Dovetail</label> */}

                    </li>
                    <li>
                        <label for="width">Width
                        </label>
                        <ispace-number-scrubber name="width" value={width} onchange={this.onChange} onscrub={this.onChange} onfinish={this.onChange}></ispace-number-scrubber>
                    </li>
                    <li>
                        <label for="depth">Depth
                        </label>
                        <ispace-number-scrubber name="depth" value={depth} onchange={this.onChange} onscrub={this.onChange} onfinish={this.onChange}></ispace-number-scrubber>
                    </li>
                    {/* <li>
                        <label for="floorRadius">Floor Radius
                        </label>
                        <ispace-number-scrubber name="floorRadius" value={floorRadius} onchange={this.onChange} onscrub={this.onChange} onfinish={this.onChange}></ispace-number-scrubber>
                    </li> */}
                    <li>
                        <label for="tailAngle">Tail angle
                        </label>
                        <ispace-number-scrubber name="tailAngle" value={tailAngle} onchange={this.onChange} onscrub={this.onChange} onfinish={this.onChange}></ispace-number-scrubber>
                    </li>
                    <li>
                        <label for="bottomWidth">Bottom width
                        </label>
                        <ispace-number-scrubber name="bottomWidth" value={bottomWidth} onchange={this.onChange} onscrub={this.onChange} onfinish={this.onChange}></ispace-number-scrubber>
                    </li>
                    <li>
                        <label for="bottomDepth">Bottom depth
                        </label>
                        <ispace-number-scrubber name="bottomDepth" value={bottomDepth} onchange={this.onChange} onscrub={this.onChange} onfinish={this.onChange}></ispace-number-scrubber>
                    </li>
                    {/* <li>
                        <label for="placeAngle">Place angle
                        </label>
                        <ispace-number-scrubber name="placeAngle" value={placeAngle} onchange={this.onChange} onscrub={this.onChange} onfinish={this.onChange}></ispace-number-scrubber>
                    </li>
                    <li>
                        <label for="azimuthAngle">Azimuth angle
                        </label>
                        <ispace-number-scrubber name="azimuthAngle" value={azimuthAngle} onchange={this.onChange} onscrub={this.onChange} onfinish={this.onChange}></ispace-number-scrubber>
                    </li> */}
                </ul></>, this);
    }
}
customElements.define('ispace-hole-dialog', SlotDialog);