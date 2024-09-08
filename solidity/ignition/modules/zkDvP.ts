// Copyright © 2024 Kaleido, Inc.
//
// SPDX-License-Identifier: Apache-2.0
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("zkDvP", (m) => {
  const paymentTokenAddress = m.getParameter("paymentToken");
  const paymentToken = m.contractAt('Zeto_Anon', paymentTokenAddress);
  const assetTokenAddress = m.getParameter("assetToken");
  const assetToken = m.contractAt('Zeto_NfAnon', assetTokenAddress);

  const zkDvP = m.contract('zkDvP', [paymentToken, assetToken]);
  return { zkDvP };
});