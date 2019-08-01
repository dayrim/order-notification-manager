import { renderStoredView } from "../utils/view";
import { PickupStatus } from "../constants/pickup-status";
import { UNPROCESSED_ORDERS_LIST } from "../constants/templates";

export class NotificationButton {
  constructor(store) {
    this.store = store;
    this.html = $(`
      <li>
        <span class="sync pointer" id="onm-notification-button-container" style="top: 8px;">
          <span class="btn-badge" style="top: 10px; left: 12px; z-index: 1">0</span>
          <span class="navbar-icon icon_bag_alt text-24px flip-horizontal" id="onm-notification-button"></span>
        </span>
      </li>
    `);

    TSPOS.EventManager.addEventListener(
      "onm_after_orders_update",
      this.render.bind(this)
    );
  }

  render() {
    const state = this.store.getState();

    const unpickedOrders = state.unprocessedOrders.orders.filter(
      order => order.getAttributeValue("pickupStatus") === PickupStatus.NEW
    );

    this.html.find("#onm-notification-button-container").off("click");

    if (unpickedOrders.length > 0) {
      this.html.find("#onm-notification-button").css("color", "red");
    } else {
      this.html.find("#onm-notification-button").css("color", "white");
    }

    this.html
      .find("#onm-notification-button-container .btn-badge")
      .text(state.unprocessedOrders.orders.length);
    this.html
      .find("#onm-notification-button-container")
      .on("click", () => this.handleClick());

    return this.html;
  }

  handleClick() {
    const settingsButton = $(".app-header-nav li > a.icon_cog.active");

    if (settingsButton.length !== 0) {
      // If the settings view is currently open, transition to index before
      // opening a custom view, otherwise POS will display a white page later
      window._ErplyTransitionTo("index").then(() => {
        renderStoredView({
          viewType: UNPROCESSED_ORDERS_LIST,
          dismiss: true,
          modal: false
        });
      });
    } else {
      renderStoredView({
        viewType: UNPROCESSED_ORDERS_LIST,
        dismiss: true,
        modal: false
      });
    }
  }
}
