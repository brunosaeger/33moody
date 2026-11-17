#!/usr/bin/env python3
"""Faz o TurtleBot vagar aleatoriamente pelo mapa (ferramenta de simulação).

Máquina de estados com dois estados:

  ANDAR  ── obstáculo perto na frente ──▶  GIRAR
    ▲                                        │
    └──────── girou o ângulo sorteado ───────┘

- ANDAR: vai para a frente com uma leve curva aleatória, que muda a cada
  poucos segundos (assim ele "vaga" em vez de andar só em linha reta).
- GIRAR: para, sorteia um lado e um ângulo pequeno, gira até completar e
  volta a andar. Se ainda houver obstáculo, gira de novo para o MESMO lado
  (sem isso ele ficaria indeciso, oscilando na frente da parede).

Publica direto em /cmd_vel; não use junto com um goal do Nav2 ativo.

Uso:
  source /opt/ros/jazzy/setup.bash
  python3 tools/sim/wander.py
"""

import math
import random

import rclpy
from geometry_msgs.msg import Twist
from rclpy.node import Node
from rclpy.qos import qos_profile_sensor_data
from sensor_msgs.msg import LaserScan

# --- comportamento (m, m/s, rad, rad/s) ---
FORWARD_SPEED = 0.18           # o Waffle aguenta 0.26 m/s
OBSTACLE_DISTANCE = 0.45       # obstáculo "muito próximo" na frente
FRONT_HALF_ANGLE = math.radians(35)  # setor considerado "frente": ±35°
TURN_SPEED = 0.9
TURN_ANGLE_RANGE = (math.radians(25), math.radians(70))  # "um pouquinho"
WANDER_MAX_CURVE = 0.25        # curva aleatória máxima andando (rad/s)
WANDER_CHANGE_S = (2.0, 5.0)   # a cada quanto tempo sorteia uma curva nova
CONTROL_HZ = 10.0


class Wanderer(Node):
    def __init__(self) -> None:
        super().__init__('moody_wanderer')
        self.cmd_pub = self.create_publisher(Twist, '/cmd_vel', 10)
        # LaserScan usa QoS "sensor data" (best effort) no TurtleBot.
        self.create_subscription(LaserScan, '/scan', self.on_scan, qos_profile_sensor_data)
        self.create_timer(1.0 / CONTROL_HZ, self.control)

        self.front_distance = math.inf
        self.has_scan = False
        self.state = 'ANDAR'
        self.turn_direction = 1.0   # +1 esquerda, -1 direita
        self.turn_remaining = 0.0   # rad que ainda faltam girar
        self.curve = 0.0
        self.next_curve_change = 0.0
        self.get_logger().info('Vagando. Ctrl+C para parar.')

    # --- percepção ---

    def on_scan(self, scan: LaserScan) -> None:
        """Menor distância válida no setor da frente."""
        nearest = math.inf
        for i, r in enumerate(scan.ranges):
            if not (scan.range_min < r < scan.range_max):
                continue
            # Ângulo do feixe normalizado para (-π, π]: 0 = frente do robô.
            a = scan.angle_min + i * scan.angle_increment
            a = math.atan2(math.sin(a), math.cos(a))
            if abs(a) <= FRONT_HALF_ANGLE and r < nearest:
                nearest = r
        self.front_distance = nearest
        self.has_scan = True

    # --- decisão ---

    def control(self) -> None:
        if not self.has_scan:
            return
        now = self.get_clock().now().nanoseconds / 1e9
        dt = 1.0 / CONTROL_HZ
        cmd = Twist()

        if self.state == 'ANDAR':
            if self.front_distance < OBSTACLE_DISTANCE:
                self.start_turn(new_side=True)
            else:
                if now >= self.next_curve_change:
                    self.curve = random.uniform(-WANDER_MAX_CURVE, WANDER_MAX_CURVE)
                    self.next_curve_change = now + random.uniform(*WANDER_CHANGE_S)
                cmd.linear.x = FORWARD_SPEED
                cmd.angular.z = self.curve

        if self.state == 'GIRAR':
            cmd.angular.z = self.turn_direction * TURN_SPEED
            self.turn_remaining -= TURN_SPEED * dt
            if self.turn_remaining <= 0:
                if self.front_distance < OBSTACLE_DISTANCE:
                    self.start_turn(new_side=False)  # ainda bloqueado: mesmo lado
                else:
                    self.state = 'ANDAR'
                    self.curve = 0.0

        self.cmd_pub.publish(cmd)

    def start_turn(self, new_side: bool) -> None:
        if new_side:
            self.turn_direction = random.choice((-1.0, 1.0))
            side = 'esquerda' if self.turn_direction > 0 else 'direita'
            self.get_logger().info(
                f'Obstáculo a {self.front_distance:.2f} m: girando para a {side}')
        self.turn_remaining = random.uniform(*TURN_ANGLE_RANGE)
        self.state = 'GIRAR'

    def stop(self) -> None:
        self.cmd_pub.publish(Twist())


def main() -> None:
    rclpy.init()
    node = Wanderer()
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        node.stop()  # não deixa o robô andando sozinho ao sair
        node.destroy_node()
        rclpy.try_shutdown()


if __name__ == '__main__':
    main()
